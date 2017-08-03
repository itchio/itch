import * as osnet from "net";
import * as StreamSplitter from "stream-splitter";
import LFTransform from "../../os/lf-transform";

import * as tmp from "tmp";
import * as bluebird from "bluebird";
import {
  isEmpty,
  first,
  filter,
  reject,
  partition,
  map,
  each,
} from "underscore";

import { ICave } from "../../db/models/cave";
import { IGame } from "../../db/models/game";

import spawn from "../../os/spawn";
import * as paths from "../../os/paths";
import * as sf from "../../os/sf";
import * as registry from "../../os/win32/registry";

import { request, getChecksums, ensureChecksum } from "../../net";
import butler from "../../util/butler";
import { Logger } from "../../logger";

import { join } from "path";
import urls from "../../constants/urls";

import * as actions from "../../actions";
import Context from "../../context";

import {
  IManifest,
  IManifestPrereq,
  IRedistInfo,
  IPrereqsState,
  IProgressListener,
  TaskProgressStatus,
  IRuntime,
} from "../../types";

import { IAction, IOpenModalPayload } from "../../constants/action-types";

import { IPrereqsStateParams } from "../../components/modal-widgets/prereqs-state";

interface IWindowsPrereqsOpts {
  cave: ICave;
  game: IGame;
  manifest: IManifest;
  logger: Logger;
  runtime: IRuntime;
}

interface IInstallPlan {
  tasks: IInstallPlanItem[];
}

interface IInstallPlanItem {
  name: string;
  workDir: string;
  info: IRedistInfo;
}

interface IButlerPrereqMessage {
  type: "state" | "log";
}

interface IButlerPrereqLogEntry extends IButlerPrereqMessage {
  message: string;
}

interface IButlerPrereqResult extends IButlerPrereqMessage {
  name: string;
  status: TaskProgressStatus;
}

import { extract } from "../../util/extract";

export default async function handleWindowsPrereqs(
  ctx: Context,
  opts: IWindowsPrereqsOpts,
) {
  const { cave } = opts;

  await handleUE4Prereq(ctx, cave, opts);
  await handleManifest(ctx, opts);
}

const WIN32_UE4_RE = "UE4PrereqSetup_x86.exe";
const WIN64_UE4_RE = "UE4PrereqSetup_x64.exe";

async function handleUE4Prereq(
  ctx: Context,
  cave: ICave,
  opts: IWindowsPrereqsOpts,
) {
  // TODO: provide escape hatch for when they absolutely won't install

  if (cave.installedUE4Prereq) {
    return;
  }

  const { runtime } = opts;

  let openModalAction: IAction<IOpenModalPayload>;
  const { db, store } = ctx;
  const logger = opts.logger.child({ name: "windows-prereqs" });

  try {
    const pattern = runtime.is64 ? WIN64_UE4_RE : WIN32_UE4_RE;
    const prefs = store.getState().preferences;
    const appPath = paths.appPath(cave, prefs);
    const candidates = await sf.glob(pattern, { cwd: appPath, nocase: true });
    const prereqRelativePath = first(candidates);
    if (!prereqRelativePath) {
      // no UE4 prereqs
      return;
    }

    const prereqFullPath = join(appPath, prereqRelativePath);

    let prereqsState: IPrereqsState = {
      tasks: {
        ue4: {
          name: "Unreal Engine 4 prerequisites",
          status: "installing",
          order: 1,
          progress: 0,
          eta: 0,
          bps: 0,
        },
      },
    };
    ctx.emitProgress({
      progress: 0,
      prereqsState,
    });

    const { game } = opts;
    openModalAction = actions.openModal({
      title: ["grid.item.installing"],
      message: "",
      widget: "prereqs-state",
      widgetParams: {
        gameId: String(cave.gameId),
        gameTitle: game.title,
      } as IPrereqsStateParams,
      buttons: [],
      unclosable: true,
    });
    store.dispatch(openModalAction);

    logger.info(`launching UE4 prereq setup ${prereqFullPath}`);
    const code = await spawn({
      command: prereqFullPath,
      args: [
        "/quiet", // don't show UI, don't propose to uninstall/modify
        "/norestart", // don't ask for OS to reboot
      ],
      onToken: tok => logger.info(`[ue4-prereq out] ${tok}`),
      onErrToken: tok => logger.info(`[ue4-prereq err] ${tok}`),
      ctx,
      logger,
    });

    if (code === 0) {
      logger.info("successfully installed UE4 prereq");
      db.saveOne("caves", cave.id, {
        installedUE4Prereq: true,
      });
    } else {
      logger.error(`couldn't install UE4 prereq (exit code ${code})`);
    }
  } catch (e) {
    logger.error(
      `error while launching UE4 prereq for ${cave.id}: ${e.stack || e}`,
    );
  } finally {
    if (openModalAction) {
      store.dispatch(actions.closeModal({ id: openModalAction.payload.id }));
    }

    ctx.emitProgress({
      progress: 0,
      prereqsState: {
        tasks: {},
      },
    });
  }
}

interface IPrereqTask {
  /** prereq info taken from manifest */
  prereq: IManifestPrereq;

  /** contents of info.json file */
  info: IRedistInfo;

  /** if true, no further action is required */
  alreadyInstalled: boolean;
}

async function handleManifest(ctx: Context, opts: IWindowsPrereqsOpts) {
  const { manifest, logger } = opts;
  const { store } = ctx;
  if (!manifest) {
    // TODO: auto-detect etc.
    logger.info(`no manifest, nothing to do`);
    return;
  }

  if (isEmpty(manifest.prereqs)) {
    logger.info(`manifest, but no prereqs, nothing to do`);
    return;
  }

  let prereqs = pendingPrereqs(opts, manifest.prereqs);
  if (isEmpty(prereqs)) {
    // everything already done
    logger.info(`manifest, prereqs, but none are pending, nothing to do`);
    return;
  }

  logger.info(
    `Assessing prereqs ${prereqs.map(prereq => prereq.name).join(", ")}`,
  );

  let tasks = await bluebird.map(prereqs, async function(prereq) {
    return await assessDep(ctx, opts, prereq);
  });

  const { cave } = opts;
  const { db } = ctx;

  let installedPrereqs = cave.installedPrereqs || {};

  let [alreadyInstalledTasks, remainingTasks] = partition(
    tasks,
    task => task.alreadyInstalled,
  );
  if (!isEmpty(alreadyInstalledTasks)) {
    logger.info(
      `Already installed: ${alreadyInstalledTasks
        .map(task => task.prereq.name)
        .join(", ")}`,
    );
    const alreadyInstalledPrereqs = {} as {
      [key: string]: boolean;
    };
    for (const task of alreadyInstalledTasks) {
      alreadyInstalledPrereqs[task.prereq.name] = true;
    }
    installedPrereqs = { ...installedPrereqs, ...alreadyInstalledPrereqs };
    db.saveOne("caves", cave.id, { installedPrereqs });
  }

  if (isEmpty(remainingTasks)) {
    return;
  }
  logger.info(
    `Remaining tasks: ${remainingTasks
      .map(task => task.prereq.name)
      .join(", ")}`,
  );

  const workDir = tmp.dirSync();
  let openModalAction: IAction<IOpenModalPayload>;
  let pollState = true;

  try {
    tasks = filter(remainingTasks, null);

    let prereqsState: IPrereqsState = {
      tasks: {},
    };

    each(tasks, (task, i) => {
      prereqsState.tasks[task.prereq.name] = {
        name: task.info.fullName,
        status: "downloading",
        order: i,
        progress: 0,
        eta: 0,
        bps: 0,
      };
    });

    const sendProgress = () => {
      ctx.emitProgress({
        progress: 0,
        prereqsState,
      });
    };
    sendProgress();

    const { game } = opts;
    openModalAction = actions.openModal({
      title: ["grid.item.installing"],
      message: "",
      widget: "prereqs-state",
      widgetParams: {
        gameId: String(cave.gameId),
        gameTitle: game.title,
      } as IPrereqsStateParams,
      buttons: [],
      unclosable: true,
    });

    store.dispatch(openModalAction);

    await bluebird.all(
      map(tasks, async (task, i) => {
        const prereqName = task.prereq.name;
        const onProgress: IProgressListener = progressInfo => {
          prereqsState = {
            tasks: {
              ...prereqsState.tasks,
              [prereqName]: {
                ...prereqsState.tasks[prereqName],
                ...progressInfo,
              },
            },
          };
          sendProgress();
        };
        const onStatus: ITaskProgressStatusListener = status => {
          prereqsState = {
            tasks: {
              ...prereqsState.tasks,
              [prereqName]: {
                ...prereqsState.tasks[prereqName],
                status,
              },
            },
          };
        };
        // FIXME: use sub-context for progress here
        await fetchDep(ctx, logger, task, workDir.name, onProgress, onStatus);
      }),
    );

    const installPlan: IInstallPlan = {
      tasks: map(tasks, task => {
        return {
          name: task.prereq.name,
          workDir: getWorkDir(workDir.name, task.prereq),
          info: task.info,
        };
      }),
    };

    const installPlanContents = JSON.stringify(installPlan, null, 2);

    const installPlanFullPath = join(workDir.name, "install_plan.json");
    await sf.writeFile(installPlanFullPath, installPlanContents, {
      encoding: "utf8",
    });

    logger.info(`Wrote install plan to ${installPlanFullPath}`);

    const stateDirPath = join(workDir.name, "statedir");
    await sf.mkdir(stateDirPath);

    logger.info("Installing all prereqs via butler...");

    const namedPipeName = `butler-windows-prereqs-${Date.now().toFixed(0)}`;
    const namedPipePath = "\\\\.\\pipe\\" + namedPipeName;

    logger.info(`Listening to status updates on ${namedPipePath}`);

    const butlerLogger = logger.child({ name: "butler-prereqs" });

    const server = osnet.createServer(function(stream) {
      const splitter = stream
        .pipe(new LFTransform())
        .pipe(StreamSplitter("\n"));
      splitter.encoding = "utf8";
      splitter.on("token", (token: string) => {
        try {
          let msg: IButlerPrereqMessage;
          try {
            msg = JSON.parse(token);
          } catch (err) {
            logger.warn(`Couldn't parse line of butler output: ${token}`);
            return;
          }

          if (msg.type === "state") {
            const butlerState = msg as IButlerPrereqResult;
            if (butlerState.name && butlerState.status) {
              prereqsState = {
                ...prereqsState,
                tasks: {
                  ...prereqsState.tasks,
                  [butlerState.name]: {
                    ...prereqsState.tasks[butlerState.name],
                    status: butlerState.status as TaskProgressStatus,
                  },
                },
              };
              sendProgress();
            }
          } else if (msg.type === "log") {
            const butlerLogEntry = msg as IButlerPrereqLogEntry;
            butlerLogger.info(butlerLogEntry.message);
          }
        } catch (e) {
          logger.warn(`Could not parse status update: ${e.stack}`);
        }
      });
    });
    server.listen(namedPipePath);

    await butler.installPrereqs(installPlanFullPath, {
      pipe: namedPipePath,
      ctx,
      logger,
    });

    const nowInstalledPrereqs = {} as {
      [key: string]: boolean;
    };
    for (const task of tasks) {
      nowInstalledPrereqs[task.prereq.name] = true;
    }
    installedPrereqs = { ...installedPrereqs, ...nowInstalledPrereqs };
    db.saveOne("caves", cave.id, { installedPrereqs });
  } finally {
    pollState = false;

    if (openModalAction) {
      store.dispatch(actions.closeModal({ id: openModalAction.payload.id }));
    }

    try {
      await butler.wipe(workDir.name, { ctx, logger });
    } catch (e) {
      logger.warn(`Couldn't wipe: ${e}`, e);
    }
  }
}

function pendingPrereqs(
  opts: IWindowsPrereqsOpts,
  prereqs: IManifestPrereq[],
): IManifestPrereq[] {
  const installedPrereqs = opts.cave.installedPrereqs || {};

  return reject(prereqs, prereq => installedPrereqs[prereq.name]);
}

/**
 * Assess the amount of work needed for a prereq
 * Does registry checks, DLL checks, with a bit of luck there's nothing to do
 */
async function assessDep(
  ctx: Context,
  opts: IWindowsPrereqsOpts,
  prereq: IManifestPrereq,
): Promise<IPrereqTask> {
  const { logger } = opts;
  const infoUrl = `${getBaseURL(prereq)}/info.json`;
  logger.info(`Retrieving ${infoUrl}`);
  // bust cloudflare cache
  const infoRes = await request(
    "get",
    infoUrl,
    { t: Date.now() },
    { format: "json" },
  );
  if (infoRes.statusCode !== 200) {
    throw new Error(
      `Could not install prerequisite ${prereq.name}: server replied with HTTP ${infoRes.statusCode}`,
    );
  }

  const info = infoRes.body as IRedistInfo;

  let hasRegistry = false;

  if (info.registryKeys) {
    for (const registryKey of info.registryKeys) {
      try {
        await registry.regQuery(ctx, registryKey, { quiet: true });
        hasRegistry = true;
        logger.info(`Found registry key ${registryKey}`);
        break;
      } catch (e) {
        logger.info(`Key not present: ${registryKey}`);
      }
    }
  }

  let hasValidLibraries = false;

  if (hasRegistry) {
    if (info.dlls) {
      const dllassert = `dllassert${info.arch === "amd64" ? "64" : "32"}`;
      hasValidLibraries = true;
      for (const dll of info.dlls) {
        const code = await spawn({
          command: dllassert,
          args: [dll],
          logger,
          ctx,
        });
        if (code !== 0) {
          logger.warn(`Could not assert dll ${dll}`);
          hasValidLibraries = false;
        }
      }
    } else {
      logger.info(
        `Traces of packages already found, no DLLs to test, assuming good!`,
      );
      hasValidLibraries = true;
    }
  }

  return {
    prereq,
    info,
    alreadyInstalled: hasValidLibraries,
  };
}

/**
 * Get the base URL for a prerequisite, where its info.json
 * file is stored, along with the archive we might need to download.
 */
function getBaseURL(prereq: IManifestPrereq): string {
  return `${urls.redistsBase}/${prereq.name}`;
}

function getWorkDir(baseWorkDir: string, prereq: IManifestPrereq): string {
  return join(baseWorkDir, prereq.name);
}

interface ITaskProgressStatusListener {
  (status: TaskProgressStatus): void;
}

async function fetchDep(
  ctx: Context,
  logger: Logger,
  task: IPrereqTask,
  baseWorkDir: string,
  onProgress: IProgressListener,
  onStatus: ITaskProgressStatusListener,
) {
  const { prereq, info } = task;

  const workDir = getWorkDir(baseWorkDir, prereq);
  await sf.mkdir(workDir);

  onStatus("downloading");

  logger.info(`Downloading prereq ${info.fullName}`);
  const baseUrl = getBaseURL(prereq);
  const archiveUrl = `${baseUrl}/${prereq.name}.7z`;
  const archivePath = join(workDir, `${prereq.name}.7z`);

  await butler.cp({
    src: archiveUrl,
    dest: archivePath,
    logger,
    ctx,
  });

  onStatus("extracting");

  logger.info(`Verifiying integrity of ${info.fullName} archive`);
  const algo = "SHA256";
  const sums = await getChecksums(logger, `${baseUrl}`, algo);
  const sum = sums[`${prereq.name}.7z`];

  await ensureChecksum(logger, {
    algo,
    expected: sum.hash,
    file: archivePath,
  });

  logger.info(`Extracting ${info.fullName} archive`);
  await extract({
    logger,
    ctx,
    archivePath,
    destPath: workDir,
  });

  onStatus("ready");

  onProgress({ progress: 1.0, eta: 0, bps: 0 });
}
