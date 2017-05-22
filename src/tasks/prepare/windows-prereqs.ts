
import * as osnet from "net";
import * as StreamSplitter from "stream-splitter";
import LFTransform from "../../os/lf-transform";

import * as tmp from "tmp";
import * as bluebird from "bluebird";
import {isEmpty, find, filter, reject, partition, map, each} from "underscore";

import spawn from "../../os/spawn";
import * as paths from "../../os/paths";
import sf from "../../os/sf";
import * as os from "../../os";
import registry from "../../os/win32/registry";

import net from "../../api/net";
import butler from "../../util/butler";
import {Logger} from "../../logger";

import * as ospath from "path";
import urls from "../../constants/urls";

import * as actions from "../../actions";

import {
  IManifest, IManifestPrereq, ICaveRecord, IStore,
  IRedistInfo, IPrereqsState,
  IProgressListener, TaskProgressStatus,
} from "../../types";

import {
  IAction, IOpenModalPayload,
} from "../../constants/action-types";

import {IPrereqsStateParams} from "../../components/modal-widgets/prereqs-state";

interface IWindowsPrereqsOpts {
  store: IStore;
  manifest: IManifest;
  caveId: string;
  logger: Logger;
  emitter: EventEmitter;
}

interface IInstallPlan {
  tasks: IInstallPlanItem[];
}

interface IInstallPlanItem {
  name: string;
  workDir: string;
  info: IRedistInfo;
}

interface IButlerPrereqResult {
  name: string;
  status: TaskProgressStatus;
}

import {EventEmitter} from "events";
import extract from "../../util/extract";

export default async function handleWindowsPrereqs (opts: IWindowsPrereqsOpts) {
  const {caveId} = opts;
  // FIXME: db
  const globalMarket: any = null;
  const cave = globalMarket.getEntity("caves", caveId);

  await handleUE4Prereq(cave, opts);
  await handleManifest(opts);
}

const WIN32_UE4_RE = /UE4PrereqSetup_x86.exe$/i;
const WIN64_UE4_RE = /UE4PrereqSetup_x64.exe$/i;

async function handleUE4Prereq (cave: ICaveRecord, opts: IWindowsPrereqsOpts) {
  if (cave.installedUE4Prereq) {
    return;
  }

  let openModalAction: IAction<IOpenModalPayload>;
  const {logger} = opts;

  // FIXME: db
  const globalMarket: any = null;

  try {
    const executables = cave.executables;
    const setupRE = os.isWin64() ? WIN64_UE4_RE : WIN32_UE4_RE;

    const prereqRelativePath = find(executables, (x: string) => setupRE.test(x));
    if (!prereqRelativePath) {
      // no UE4 prereqs
      return;
    }

    const appPath = paths.appPath(cave, opts.store.getState().preferences);
    const prereqFullPath = ospath.join(appPath, prereqRelativePath);

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
    opts.emitter.emit("progress", {
      progress: 0,
      prereqsState,
    });

    openModalAction = actions.openModal({
      title: ["grid.item.installing"],
      message: "",
      widget: "prereqs-state",
      widgetParams: {
        gameId: String(cave.gameId),
        gameTitle: cave.game.title,
      } as IPrereqsStateParams,
      buttons: [],
      unclosable: true,
    });
    opts.store.dispatch(openModalAction);

    logger.info(`launching UE4 prereq setup ${prereqFullPath}`);
    const code = await spawn({
      command: prereqFullPath,
      args: [
        "/quiet", // don't show UI, don't propose to uninstall/modify
        "/norestart", // don't ask for OS to reboot
      ],
      onToken: (tok) => logger.info(`[ue4-prereq out] ${tok}`),
      onErrToken: (tok) => logger.info(`[ue4-prereq err] ${tok}`),
    });

    if (code === 0) {
      logger.info("successfully installed UE4 prereq");
      await globalMarket.saveEntity("caves", cave.id, {
        installedUE4Prereq: true,
      }, {wait: true});
    } else {
      logger.error(`couldn't install UE4 prereq (exit code ${code})`);
    }
  } catch (e) {
    logger.error(`error while launching UE4 prereq for ${cave.id}: ${e.stack || e}`);
  } finally {
    if (openModalAction) {
      opts.store.dispatch(actions.closeModal({id: openModalAction.payload.id}));
    }

    opts.emitter.emit("progress", {
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

async function handleManifest (opts: IWindowsPrereqsOpts) {
  const {manifest, logger} = opts;
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

  logger.info(`Assessing prereqs ${prereqs.map((prereq) => prereq.name).join(", ")}`);

  let tasks = await bluebird.map(prereqs, async function (prereq) {
    return await assessDep(opts, prereq);
  });

  const {caveId} = opts;
  // FIXME: db
  const globalMarket: any = null;

  const cave = globalMarket.getEntity<ICaveRecord>("caves", caveId);
  let installedPrereqs = cave.installedPrereqs || {};

  let [alreadyInstalledTasks, remainingTasks] = partition(tasks, (task) => task.alreadyInstalled);
  if (!isEmpty(alreadyInstalledTasks)) {
    logger.info(`Already installed: ${alreadyInstalledTasks.map((task) => task.prereq.name).join(", ")}`);
    const alreadyInstalledPrereqs = {} as {
      [key: string]: boolean;
    };
    for (const task of alreadyInstalledTasks) {
      alreadyInstalledPrereqs[task.prereq.name] = true;
    }
    installedPrereqs = {...installedPrereqs, ...alreadyInstalledPrereqs};
    await globalMarket.saveEntity("caves", caveId, {installedPrereqs});
  }

  if (isEmpty(remainingTasks)) {
    return;
  }
  logger.info(`Remaining tasks: ${remainingTasks.map((task) => task.prereq.name).join(", ")}`);

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
      opts.emitter.emit("progress", {
        progress: 0,
        prereqsState,
      });
    };
    sendProgress();

    openModalAction = actions.openModal({
      title: ["grid.item.installing"],
      message: "",
      widget: "prereqs-state",
      widgetParams: {
        gameId: String(cave.gameId),
        gameTitle: cave.game.title,
      } as IPrereqsStateParams,
      buttons: [],
      unclosable: true,
    });
    opts.store.dispatch(openModalAction);

    await bluebird.all(map(tasks, async (task, i) => {
      const prereqName = task.prereq.name;
      const onProgress: IProgressListener = (progressInfo) => {
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
      const onStatus: ITaskProgressStatusListener = (status) => {
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
      await fetchDep(opts, task, workDir.name, onProgress, onStatus);
    }));

    const installPlan: IInstallPlan = {
      tasks: map(tasks, (task) => {
        return {
          name: task.prereq.name,
          workDir: getWorkDir(workDir.name, task.prereq),
          info: task.info,
        };
      }),
    };

    const installPlanContents = JSON.stringify(installPlan, null, 2);

    const installPlanFullPath = ospath.join(workDir.name, "install_plan.json");
    await sf.writeFile(installPlanFullPath, installPlanContents, {encoding: "utf8"});

    logger.info(`Wrote install plan to ${installPlanFullPath}`);
    const emitter = new EventEmitter();

    const stateDirPath = ospath.join(workDir.name, "statedir");
    await sf.mkdir(stateDirPath);

    emitter.on("result", (result: IButlerPrereqResult) => {
      prereqsState = {
        ...prereqsState,
        tasks: {
          ...prereqsState.tasks,
          [result.name]: {
            ...prereqsState.tasks[result.name],
            status: result.status,
          },
        },
      };
      sendProgress();
    });

    logger.info("Installing all prereqs via butler...");

    const namedPipeName = `butler-windows-prereqs-${Date.now().toFixed(0)}`;
    const namedPipePath = "\\\\.\\pipe\\" + namedPipeName;

    logger.info(`Listening to status updates on ${namedPipePath}`);

    const server = osnet.createServer(function (stream) {
      const splitter = stream.pipe(new LFTransform()).pipe(StreamSplitter("\n"));
      splitter.encoding = "utf8";
      splitter.on("token", (token: string) => {
        try {
          let status: any;
          try {
            status = JSON.parse(token);
          } catch (err) {
            logger.warn(`Couldn't parse line of butler output: ${token}`);
            return;
          }

          if (status.name && status.status) {
            prereqsState = {
              ...prereqsState,
              tasks: {
                ...prereqsState.tasks,
                [status.name]: {
                  ...prereqsState.tasks[status.name],
                  status: status.status as TaskProgressStatus,
                },
              },
            };
            sendProgress();
          }
        } catch (e) {
          logger.warn(`Could not parse status update: ${e.stack}`);
        }
      });
    });
    server.listen(namedPipePath);

    await butler.installPrereqs(installPlanFullPath, {
      pipe: namedPipePath,
      logger: opts.logger,
      emitter,
    });

    const nowInstalledPrereqs = {} as {
      [key: string]: boolean;
    };
    for (const task of tasks) {
      nowInstalledPrereqs[task.prereq.name] = true;
    }
    installedPrereqs = {...installedPrereqs, ...nowInstalledPrereqs};
    await globalMarket.saveEntity("caves", caveId, {installedPrereqs});
  } finally {
    pollState = false;

    if (openModalAction) {
      opts.store.dispatch(actions.closeModal({id: openModalAction.payload.id}));
    }

    const emitter = new EventEmitter();
    try {
      await butler.wipe(workDir.name, {emitter});
    } catch (e) {
      logger.warn(`Couldn't wipe: ${e}`, e);
    }
  }
}

function pendingPrereqs (opts: IWindowsPrereqsOpts, prereqs: IManifestPrereq[]): IManifestPrereq[] {
  // FIXME: db
  const globalMarket: any = null;

  const cave = globalMarket.getEntity("caves", opts.caveId);
  const installedPrereqs = cave.installedPrereqs || {};

  return reject(prereqs, (prereq) => installedPrereqs[prereq.name]);
}

/**
 * Assess the amount of work needed for a prereq
 * Does registry checks, DLL checks, with a bit of luck there's nothing to do
 */
async function assessDep (opts: IWindowsPrereqsOpts, prereq: IManifestPrereq): Promise<IPrereqTask> {
  const {logger} = opts;
  const infoUrl = `${getBaseURL(prereq)}/info.json`;
  logger.info(`Retrieving ${infoUrl}`);
  // bust cloudflare cache
  const infoRes = await net.request("get", infoUrl, {t: Date.now()}, {format: "json"});
  if (infoRes.statusCode !== 200) {
    throw new Error(`Could not install prerequisite ${prereq.name}: server replied with HTTP ${infoRes.statusCode}`);
  }

  const info = infoRes.body as IRedistInfo;

  let hasRegistry = false;

  if (info.registryKeys) {
    for (const registryKey of info.registryKeys) {
      try {
        await registry.regQuery(registryKey, {quiet: true});
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
      const dllassert = `dllassert${info.arch === "amd64" ? "64" : "32"}` ;
      hasValidLibraries = true;
      for (const dll of info.dlls) {
        const code = await spawn({
          command: dllassert,
          args: [dll],
          logger,
        });
        if (code !== 0) {
          logger.warn(`Could not assert dll ${dll}`);
          hasValidLibraries = false;
        }
      }
    } else {
      logger.info(`Traces of packages already found, no DLLs to test, assuming good!`);
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
  return ospath.join(baseWorkDir, prereq.name);
}

interface ITaskProgressStatusListener {
  (status: TaskProgressStatus): void;
}

async function fetchDep (
    opts: IWindowsPrereqsOpts, task: IPrereqTask, baseWorkDir: string,
    onProgress: IProgressListener, onStatus: ITaskProgressStatusListener) {
  const {prereq, info} = task;
  const {logger} = opts;
 
  const workDir = getWorkDir(baseWorkDir, prereq);
  await sf.mkdir(workDir);

  onStatus("downloading");

  logger.info(`Downloading prereq ${info.fullName}`);
  const baseUrl = getBaseURL(prereq);
  const archiveUrl = `${baseUrl}/${prereq.name}.7z`;
  const archivePath = ospath.join(workDir, `${prereq.name}.7z`);

  await butler.cp({
    emitter: new EventEmitter(),
    onProgress,
    src: archiveUrl,
    dest: archivePath,
  });

  onStatus("extracting");

  logger.info(`Verifiying integrity of ${info.fullName} archive`);
  const algo = "SHA256";
  const sums = await net.getChecksums(opts, `${baseUrl}`, algo);
  const sum = sums[`${prereq.name}.7z`];

  await net.ensureChecksum(opts, {
    algo,
    expected: sum.hash,
    file: archivePath,
  });

  logger.info(`Extracting ${info.fullName} archive`);
  await extract.extract({
    emitter: new EventEmitter(),
    archivePath,
    destPath: workDir,
    onProgress,
  });

  onStatus("ready");

  onProgress({progress: 1.0, eta: 0, bps: 0});
}
