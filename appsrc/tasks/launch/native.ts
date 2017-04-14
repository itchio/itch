
import * as ospath from "path";
import * as invariant from "invariant";

import {map} from "underscore";
import * as shellQuote from "shell-quote";
import {EventEmitter} from "events";
import which from "../../promised/which";

import poker from "./poker";

import urls from "../../constants/urls";
import linuxSandboxTemplate from "../../constants/sandbox-policies/linux-template";

import * as actions from "../../actions";

import store from "../../store/metal-store";
import sandbox from "../../util/sandbox";
import os from "../../util/os";
import sf from "../../util/sf";
import butler from "../../util/butler";
import spawn from "../../util/spawn";
import fetch from "../../util/fetch";
import pathmaker from "../../util/pathmaker";
import * as icacls from "./icacls";

import {promisedModal} from "../../reactors/modals";
import {startTask} from "../../reactors/tasks/start-task";
import {MODAL_RESPONSE} from "../../constants/action-types";

import mklog from "../../util/log";
const log = mklog("launch/native");

import {Crash, MissingLibs} from "../errors";

import {IEnvironment, ILaunchOpts, ICaveRecord} from "../../types";

const itchPlatform = os.itchPlatform();

export default async function launch (out: EventEmitter, opts: ILaunchOpts): Promise<void> {
  const {market, credentials, env = {}} = opts;
  let {cave} = opts;
  let {args} = opts;
  invariant(cave, "launch-native has cave");
  invariant(cave, "launch-native has env");
  log(opts, `cave location: "${cave.installLocation}/${cave.installFolder}"`);

  invariant(credentials, "launch-native has credentials");

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game});
  invariant(game, "was able to fetch game properly");

  let {isolateApps} = opts.preferences;
  const appPath = pathmaker.appPath(cave, store.getState().preferences);
  let exePath: string;
  let isJar = false;
  let console = false;

  const manifestPath = ospath.join(appPath, ".itch.toml");
  const hasManifest = await sf.exists(manifestPath);
  if (opts.manifestAction) {
    const action = opts.manifestAction;
    // sandbox opt-in ?
    if (action.sandbox) {
      isolateApps = true;
    }

    if (action.console) {
      console = true;
    }

    log(opts, `manifest action picked: ${JSON.stringify(action, null, 2)}`);
    const actionPath = action.path;
    exePath = ospath.join(appPath, actionPath);
  } else {
    log(opts, "no manifest action picked");
  }

  if (!exePath) {
    const verdict = (cave as any).verdict;
    if (verdict && verdict.candidates && verdict.candidates.length > 0) {
      const candidate = verdict.candidates[0];
      exePath = ospath.join(appPath, candidate.path);
      isJar = candidate.flavor === "jar";
    }
  }

  if (!exePath) {
    const pokerOpts = {...opts, appPath};
    exePath = await poker(pokerOpts);
  }

  if (!exePath) {
    // poker failed, maybe paths shifted around?
    if (opts.hailMary) {
      // let it fail
      log(opts, "no candidates after poker and reconfiguration, giving up");
    } else {
      log(opts, "reconfiguring because still no candidates after poker");
      const {globalMarket} = opts;
      await startTask(store, {
        name: "configure",
        gameId: game.id,
        game,
        cave,
        upload: cave.uploads[cave.uploadId],
      });
      cave = globalMarket.getEntity<ICaveRecord>("caves", cave.id);
      return await launch(out, {
        ...opts,
        cave,
        hailMary: true,
      });
    }
  }

  if (!exePath) {
    const err = new Error(`No executables found (${hasManifest ? "with" : "without"} manifest)`);
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
    log(opts, "checking existence of system JRE before launching .jar");
    try {
      const javaPath = await which("java");
      args = [
        "-jar", exePath, ...args,
      ];
      cwd = ospath.dirname(exePath);
      exePath = javaPath;
    } catch (e) {
      store.dispatch(actions.openModal({
        title: "",
        message: ["game.install.could_not_launch", {title: game.title}],
        detail: ["game.install.could_not_launch.missing_jre"],
        buttons: [
          {
            label: ["grid.item.download_java"],
            icon: "download",
            action: actions.openUrl({url: urls.javaDownload}),
          },
          "cancel",
        ],
      }));
      return;
    }
  }

  log(opts, `executing '${exePath}' on '${itchPlatform}' with args '${args.join(" ")}'`);
  const argString = map(args, spawn.escapePath).join(" ");

  if (isolateApps) {
    const checkRes = await sandbox.check();
    if (checkRes.errors.length > 0) {
      throw new Error(`error(s) while checking for sandbox: ${checkRes.errors.join(", ")}`);
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
            action: actions.modalResponse({sandboxBlessing: true}),
            icon: "checkmark",
          },
          {
            label: ["docs.learn_more"],
            action: actions.openUrl({url: learnMoreMap[itchPlatform]}),
            icon: "earth",
            className: "secondary",
          },
          "cancel",
        ],
      });

      if (response.type === MODAL_RESPONSE && response.payload.sandboxBlessing) {
        // carry on
      } else {
        return; // cancelled by user
      }
    }

    const installRes = await sandbox.install(opts, checkRes.needs);
    if (installRes.errors.length > 0) {
      throw new Error(`error(s) while installing sandbox: ${installRes.errors.join(", ")}`);
    }
  }

  const spawnOpts = {
    ...opts,
    cwd,
    console,
    isolateApps,
  };

  let fullExec = exePath;
  if (itchPlatform === "osx") {
    const isBundle = isAppBundle(exePath);
    if (isBundle) {
      fullExec = await spawn.getOutput({
        command: "activate",
        args: ["--print-bundle-executable-path", exePath],
        logger: opts.logger,
      });
    }

    if (isolateApps) {
      log(opts, "app isolation enabled");

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

      await sandbox.within(sandboxOpts, async function ({fakeApp}) {
        await doSpawn(fullExec, `open -W ${spawn.escapePath(fakeApp)}`, env, out, opts);
      });
    } else {
      log(opts, "no app isolation");

      if (isBundle) {
        await doSpawn(fullExec, `open -W ${spawn.escapePath(exePath)} --args ${argString}`, env, out, spawnOpts);
      } else {
        await doSpawn(fullExec, `${spawn.escapePath(exePath)} ${argString}`, env, out, spawnOpts);
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
      });

      playerUsername = playerUsername.split("\n")[0].trim();

      log(opts, "app isolation enabled");
      await icacls.shareWith({logger: opts.logger, sid: playerUsername, path: grantPath});
      cmd = `isolate ${cmd}`;
    } else {
      log(opts, "no app isolation");
    }

    try {
      await doSpawn(exePath, cmd, env, out, spawnOpts);
    } finally {
      // always unshare, even if something happened
      if (isolateApps) {
        await icacls.unshareWith({logger: opts.logger, sid: playerUsername, path: grantPath});
      }
    }
  } else if (itchPlatform === "linux") {
    let cmd = `${spawn.escapePath(exePath)}`;
    if (argString.length > 0) {
      cmd += ` ${argString}`;
    }
    if (isolateApps) {
      log(opts, "generating firejail profile");
      const sandboxProfilePath = ospath.join(appPath, ".itch", "isolate-app.profile");

      const sandboxSource = linuxSandboxTemplate;
      await sf.writeFile(sandboxProfilePath, sandboxSource, {encoding: "utf8"});

      cmd = `firejail "--profile=${sandboxProfilePath}" -- ${cmd}`;
      await doSpawn(exePath, cmd, env, out, spawnOpts);
    } else {
      log(opts, "no app isolation");
      await doSpawn(exePath, cmd, env, out, spawnOpts);
    }
  } else {
    throw new Error(`unsupported platform: ${os.platform()}`);
  }
}

interface IDoSpawnOpts extends ILaunchOpts {
  /** current working directory for spawning */
  cwd?: string;

  /** don't redirect stderr/stdout and open terminal window */
  console?: boolean;

  /** app isolation is enabled */
  isolateApps?: boolean;
}

async function doSpawn (exePath: string, fullCommand: string, env: IEnvironment, emitter: EventEmitter,
                        opts: IDoSpawnOpts) {
  log(opts, `spawn command: ${fullCommand}`);

  const cwd = opts.cwd || ospath.dirname(exePath);
  log(opts, `working directory: ${cwd}`);

  let args = shellQuote.parse(fullCommand);
  let command = args.shift();
  let shell: string = null;

  let inheritStd = false;
  const {console} = opts;
  if (console) {
    log(opts, `(in console mode)`);
    if (itchPlatform === "windows") {
      if (opts.isolateApps) {
        inheritStd = true;
        env = {
          ...env,
          ISOLATE_DISABLE_REDIRECTS: "1",
        };
      } else {
        const consoleCommandItems = [command, ...args];
        const consoleCommand = consoleCommandItems.map((arg) => `"${arg}"`).join(" ");

        inheritStd = true;
        args = ["/wait", "cmd.exe", "/k", consoleCommand];
        command = "start";
        shell = "cmd.exe";
      }
    } else {
      log(opts, `warning: console mode not supported on ${itchPlatform}`);
    }
  }

  const tmpPath = ospath.join(cwd, ".itch", "temp");
  try {
    await sf.mkdir(tmpPath);
    env = {
      ...env,
      TMP: tmpPath,
      TEMP: tmpPath,
    };
  } catch (e) {
    log(opts, `could not make custom temp path: ${e.message}`);
  }

  log(opts, `command: ${command}`);
  log(opts, `args: ${JSON.stringify(args, null, 2)}`);
  log(opts, `env keys: ${JSON.stringify(Object.keys(env), null, 2)}`);

  let spawnEmitter = emitter;
  if (itchPlatform === "osx") {
    spawnEmitter = new EventEmitter();
    emitter.once("cancel", async function () {
      log(opts, `asked to cancel, calling pkill with ${exePath}`);
      const killRes = await spawn.exec({command: "pkill", args: ["-f", exePath]});
      if (killRes.code !== 0) {
        log(opts, `Failed to kill with code ${killRes.code}, out = ${killRes.out}, err = ${killRes.err}`);
        spawnEmitter.emit("cancel");
      }
    });
  }

  const missingLibs: string[] = [];
  const MISSINGLIB_RE = /: error while loading shared libraries: ([^:]+):/g;

  const capsulerunPath = process.env.CAPSULERUN_PATH;
  if (capsulerunPath) {
    args = [ "--", command, ...args ];
    command = capsulerunPath;
  }

  const code = await spawn({
    command,
    args,
    emitter: spawnEmitter,
    onToken: (tok) => log(opts, `out: ${tok}`),
    onErrToken: (tok) => {
      log(opts, `err: ${tok}`);
      const matches = MISSINGLIB_RE.exec(tok);
      if (matches) {
        missingLibs.push(matches[1]);
      }
    },
    opts: {
      env: {...process.env, ...env},
      cwd,
      shell,
    },
    inheritStd,
  });

  try {
    await butler.wipe(tmpPath);
  } catch (e) {
    log(opts, `could not remove tmp dir: ${e.message}`);
  }

  if (code !== 0) {
    if (code === 127 && missingLibs.length > 0) {
      let arch = "386";
      
      try {
        const props = await butler.elfprops({path: exePath, emitter: null, logger: opts.logger});
        arch = props.arch;
      } catch (e) {
        log(opts, `could not determine arch for crash message: ${e.message}`);
      }

      throw new MissingLibs({
        arch,
        libs: missingLibs,
      });
    } else {
      const error = `process exited with code ${code}`;
      throw new Crash({error});
    }
  }
  return "child completed successfully";
}

function isAppBundle (exePath: string) {
  return /\.app\/?$/.test(exePath.toLowerCase());
}
