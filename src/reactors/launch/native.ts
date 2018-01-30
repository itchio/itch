import { map } from "underscore";
import * as shellQuote from "shell-quote";
import which from "../../promised/which";

import urls from "../../constants/urls";
import linuxSandboxTemplate from "../../constants/sandbox-policies/linux-template";

import { fromJSONField } from "../../db/json-field";

import { actions } from "../../actions";

import sandbox from "../../util/sandbox";
import * as os from "../../os";
import * as sf from "../../os/sf";
import spawn from "../../os/spawn";
import { join, dirname, basename } from "path";
import * as paths from "../../os/paths";
import Context from "../../context";
import butler from "../../util/butler";
import * as icacls from "./icacls";

import html from "./html";

import expandManifestPath from "./expand-manifest-path";

import { promisedModal } from "../../reactors/modals";

import { formatExitCode } from "../../format/exit-code";

import rootLogger, { devNull } from "../../logger";
const logger = rootLogger.child({ name: "launch/native" });

import { IConfigureResult } from "../../util/butler";
import { IEnvironment, ILaunchOpts, Crash, MissingLibs } from "../../types";
import { ILauncher } from "./types";

import configure from "./configure";

const itchPlatform = os.itchPlatform();

const launchNative: ILauncher = async (ctx, opts) => {
  const { game, manifest, manifestAction } = opts;
  let { cave } = opts;
  const hasManifest = !!manifest;
  let { args, env } = opts;
  const { store } = ctx;

  logger.info(`cave location: "${cave.installLocation}/${cave.installFolder}"`);

  const state = store.getState();
  const { preferences } = state;
  let { isolateApps } = preferences;

  const appPath = paths.appPath(cave, preferences);
  let exePath: string;
  let isJar = false;
  let console = false;

  if (manifestAction) {
    // sandbox opt-in ?
    if (manifestAction.sandbox) {
      isolateApps = true;
    }

    if (manifestAction.console) {
      console = true;
    }

    logger.info(
      `manifest action picked: ${JSON.stringify(manifestAction, null, 2)}`
    );
    exePath = expandManifestPath(appPath, manifestAction.path);
  } else {
    logger.warn("no manifest action picked");
  }

  const verdictHasCandidates = (verdict: IConfigureResult) =>
    verdict && verdict.candidates && verdict.candidates.length > 0;

  if (!exePath) {
    let verdict = fromJSONField(cave.verdict);
    let shouldReconfigure = false;
    if (verdictHasCandidates(verdict)) {
      const candidate = verdict.candidates[0];
      const candidateAbsolutePath = join(appPath, candidate.path);
      if (!await sf.exists(candidateAbsolutePath)) {
        logger.warn(
          "has existing candidate but it disappeared, reconfiguring..."
        );
        logger.warn(`note: the culprit was ${candidateAbsolutePath}`);
        shouldReconfigure = true;
      }
    } else {
      logger.warn("has existing verdict but no candidates, reconfiguring...");
      shouldReconfigure = true;
    }

    if (shouldReconfigure) {
      await configure(ctx, opts);
      cave = ctx.db.caves.findOneById(cave.id);
      verdict = fromJSONField(cave.verdict);
    }

    if (verdictHasCandidates(verdict)) {
      logger.info(`verdict has ${verdict.candidates.length} candidates`);

      // TODO: ask to pick ?
      const candidate = verdict.candidates[0];
      exePath = join(appPath, candidate.path);
      switch (candidate.flavor) {
        case "html":
          logger.info(`${candidate.path}: is html, deferring to html launch`);
          return html(ctx, opts);
        case "jar":
          isJar = true;
          break;
        default:
        // muffin
      }
    }
  }

  if (!exePath) {
    const err = new Error(
      `No executables found (${hasManifest ? "with" : "without"} manifest)`
    );
    (err as any).reason = ["game.install.no_executables_found"];
    throw err;
  }

  let cwd: string;

  if (!isJar) {
    if (/\.jar$/i.test(exePath)) {
      isJar = true;
    }
  }

  if (isJar) {
    logger.info("checking existence of system JRE before launching .jar");
    try {
      const javaPath = await which("java");
      args = ["-jar", exePath, ...args];
      cwd = dirname(exePath);
      exePath = javaPath;
    } catch (e) {
      store.dispatch(
        actions.openModal({
          title: "",
          message: ["game.install.could_not_launch", { title: game.title }],
          detail: ["game.install.could_not_launch.missing_jre"],
          buttons: [
            {
              label: ["grid.item.download_java"],
              icon: "download",
              action: actions.openUrl({ url: urls.javaDownload }),
            },
            "cancel",
          ],
        })
      );
      return;
    }
  }

  logger.info(
    `executing '${basename(
      exePath
    )}' on '${itchPlatform}' with args '${args.join(" ")}'`
  );
  const argString = map(args, spawn.escapePath).join(" ");

  if (isolateApps) {
    const checkRes = await sandbox.check(ctx);
    if (checkRes.errors.length > 0) {
      throw new Error(
        `error(s) while checking for sandbox: ${checkRes.errors.join(", ")}`
      );
    }

    if (checkRes.needs.length > 0) {
      const learnMoreMap: {
        [key: string]: string;
      } = {
        linux: urls.linuxSandboxSetup,
        windows: urls.windowsSandboxSetup,
      };

      const response = await promisedModal(store, {
        title: ["sandbox.setup.title"],
        message: [`sandbox.setup.${itchPlatform}.message`],
        detail: [`sandbox.setup.${itchPlatform}.detail`],
        buttons: [
          {
            label: ["sandbox.setup.proceed"],
            action: actions.modalResponse({ sandboxBlessing: true }),
            icon: "security",
          },
          {
            label: ["docs.learn_more"],
            action: actions.openUrl({ url: learnMoreMap[itchPlatform] }),
            icon: "earth",
            className: "secondary",
          },
          "cancel",
        ],
      });

      if (response && response.sandboxBlessing) {
        // carry on
      } else {
        return; // cancelled by user
      }
    }

    const installRes = await sandbox.install(ctx, checkRes.needs);
    if (installRes.errors.length > 0) {
      throw new Error(
        `error(s) while installing sandbox: ${installRes.errors.join(", ")}`
      );
    }
  }

  const spawnOpts = {
    ...opts,
    cwd,
    console,
    isolateApps,
    appPath,
  };

  let fullExec = exePath;
  if (itchPlatform === "osx") {
    const isBundle = isAppBundle(exePath);
    if (isBundle) {
      fullExec = await spawn.getOutput({
        command: "activate",
        args: ["--print-bundle-executable-path", exePath],
        ctx,
        logger: opts.logger,
      });
    }

    if (isolateApps) {
      logger.info("app isolation enabled");

      const sandboxOpts = {
        ...opts,
        game,
        appPath,
        exePath,
        fullExec,
        argString,
        isBundle,
        cwd,
        logger: opts.logger,
      };

      await sandbox.within(ctx, sandboxOpts, async function({ fakeApp }) {
        await doSpawn(
          fullExec,
          `open -W ${spawn.escapePath(fakeApp)}`,
          env,
          ctx,
          spawnOpts
        );
      });
    } else {
      logger.info("no app isolation");

      if (isBundle) {
        await doSpawn(
          fullExec,
          `open -W ${spawn.escapePath(exePath)} --args ${argString}`,
          env,
          ctx,
          spawnOpts
        );
      } else {
        await doSpawn(
          fullExec,
          `${spawn.escapePath(exePath)} ${argString}`,
          env,
          ctx,
          spawnOpts
        );
      }
    }
  } else if (itchPlatform === "windows") {
    let cmd = `${spawn.escapePath(exePath)}`;
    if (argString.length > 0) {
      cmd += ` ${argString}`;
    }

    let playerUsername: string;

    const grantPath = appPath;
    if (isolateApps) {
      playerUsername = await spawn.getOutput({
        command: "isolate.exe",
        args: ["--print-itch-player-details"],
        logger: opts.logger,
        ctx,
      });

      playerUsername = playerUsername.split("\n")[0].trim();

      logger.info("app isolation enabled");
      await icacls.shareWith(ctx, {
        logger: opts.logger,
        sid: playerUsername,
        path: grantPath,
      });
      cmd = `isolate ${cmd}`;
    } else {
      logger.info("no app isolation");
    }

    try {
      await doSpawn(exePath, cmd, env, ctx, spawnOpts);
    } finally {
      // always unshare, even if something happened
      if (isolateApps) {
        await icacls.unshareWith(ctx, {
          logger: opts.logger,
          sid: playerUsername,
          path: grantPath,
        });
      }
    }
  } else if (itchPlatform === "linux") {
    let cmd = `${spawn.escapePath(exePath)}`;
    if (argString.length > 0) {
      cmd += ` ${argString}`;
    }
    if (isolateApps) {
      logger.info("generating firejail profile");
      const sandboxProfilePath = join(appPath, ".itch", "isolate-app.profile");

      const sandboxSource = linuxSandboxTemplate;
      await sf.writeFile(sandboxProfilePath, sandboxSource, {
        encoding: "utf8",
      });

      cmd = `firejail "--profile=${sandboxProfilePath}" -- ${cmd}`;
      await doSpawn(exePath, cmd, env, ctx, spawnOpts);
    } else {
      logger.info("no app isolation");
      await doSpawn(exePath, cmd, env, ctx, spawnOpts);
    }
  } else {
    throw new Error(`unsupported platform: ${os.platform()}`);
  }
};

export default launchNative;

interface IDoSpawnOpts extends ILaunchOpts {
  /** current working directory for spawning */
  cwd?: string;

  /** don't redirect stderr/stdout and open terminal window */
  console?: boolean;

  /** app isolation is enabled */
  isolateApps?: boolean;

  /** root of the install folder */
  appPath: string;
}

async function doSpawn(
  exePath: string,
  fullCommand: string,
  env: IEnvironment,
  ctx: Context,
  opts: IDoSpawnOpts
) {
  logger.info(`spawn command: ${fullCommand}`);
  const { appPath } = opts;

  const cwd = opts.cwd || dirname(exePath);
  logger.info(`working directory: ${cwd}`);

  let args = shellQuote.parse(fullCommand);
  let command = args.shift();
  let shell: string = null;

  let inheritStd = false;
  const { console } = opts;
  if (console) {
    logger.info(`(in console mode)`);
    if (itchPlatform === "windows") {
      if (opts.isolateApps) {
        inheritStd = true;
        env = {
          ...env,
          ISOLATE_DISABLE_REDIRECTS: "1",
        };
      } else {
        const consoleCommandItems = [command, ...args];
        const consoleCommand = consoleCommandItems
          .map(arg => `"${arg}"`)
          .join(" ");

        inheritStd = true;
        args = ["/wait", "cmd.exe", "/k", consoleCommand];
        command = "start";
        shell = "cmd.exe";
      }
    } else {
      logger.info(`warning: console mode not supported on ${itchPlatform}`);
    }
  }

  const tmpPath = join(appPath, ".itch", "temp");
  try {
    await sf.mkdir(tmpPath);
    env = {
      ...env,
      TMP: tmpPath,
      TEMP: tmpPath,
    };
  } catch (e) {
    logger.warn(`could not make temporary directory: ${e.message}`);
    logger.warn(`(no matter, let's continue)`);
  }

  logger.info(`command: ${command}`);
  logger.info(`args: ${JSON.stringify(args, null, 2)}`);
  logger.info(`env keys: ${JSON.stringify(Object.keys(env), null, 2)}`);

  if (itchPlatform === "osx") {
    ctx.on("abort", async function() {
      logger.warn(`asked to cancel, calling pkill with ${exePath}`);
      const killRes = await spawn.exec({
        command: "pkill",
        args: ["-f", exePath],
        logger: devNull,
        ctx: new Context(ctx.store, ctx.db),
      });
      if (killRes.code !== 0) {
        logger.error(
          `Failed to kill with code ${killRes.code}, out = ${killRes.out}, err = ${killRes.err}`
        );
      }
    });
  }

  const missingLibs: string[] = [];
  const MISSINGLIB_RE = /: error while loading shared libraries: ([^:]+):/g;

  const capsulerunPath = process.env.CAPSULERUN_PATH;
  if (capsulerunPath) {
    args = ["--", command, ...args];
    command = capsulerunPath;
  }

  const code = await spawn({
    command,
    args,
    ctx,
    onToken: tok => logger.info(`out: ${tok}`),
    onErrToken: tok => {
      logger.info(`err: ${tok}`);
      const matches = MISSINGLIB_RE.exec(tok);
      if (matches) {
        missingLibs.push(matches[1]);
      }
    },
    opts: {
      env: { ...process.env, ...env },
      cwd,
      shell,
    },
    inheritStd,
    logger: devNull,
  });

  ctx.emitProgress({ progress: -1 });
  try {
    await butler.wipe(tmpPath, {
      ctx,
      logger: devNull,
    });
  } catch (e) {
    logger.warn(`could not wipe temporary directory: ${e.message}`);
    logger.warn(`(no matter, let's continue)`);
  }

  if (code !== 0) {
    if (code === 127 && missingLibs.length > 0) {
      let arch = "386";

      try {
        const props = await butler.elfprops({
          path: exePath,
          ctx,
          logger: opts.logger,
        });
        arch = props.arch;
      } catch (e) {
        logger.warn(`could not determine arch for crash message: ${e.message}`);
      }

      throw new MissingLibs({
        arch,
        libs: missingLibs,
      });
    } else {
      const error = `Process exited with code ${formatExitCode(code)}`;
      throw new Crash({ error });
    }
  }
  return "child completed successfully";
}

function isAppBundle(exePath: string) {
  return /\.app\/?$/.test(exePath.toLowerCase());
}
