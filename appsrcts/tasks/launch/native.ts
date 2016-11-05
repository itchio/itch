
import * as ospath from "path";
import * as invariant from "invariant";

import {map} from "underscore";
import * as shellQuote from "shell-quote";
import {EventEmitter} from "events";

import poker from "./poker";

import urls from "../../constants/urls";
import linuxSandboxTemplate from "../../constants/sandbox-policies/linux-template";

import * as actions from "../../actions";

import * as store from "../../store";
import sandbox from "../../util/sandbox";
import os from "../../util/os";
import sf from "../../util/sf";
import spawn from "../../util/spawn";
import fetch from "../../util/fetch";
import pathmaker from "../../util/pathmaker";

import {promisedModal} from "../../reactors/modals";
import {startTask} from "../../reactors/tasks/start-task";
import {MODAL_RESPONSE} from "../../constants/action-types";

import mklog from "../../util/log";
const log = mklog("tasks/launch/native");

import {Crash} from "../errors";

import {IEnvironment, IStartTaskOpts} from "../../types/db";

export default async function launch (out: EventEmitter, opts: IStartTaskOpts): Promise<void> {
  const {market, credentials, env} = opts;
  let {cave} = opts;
  let {args} = opts;
  invariant(cave, "launch-native has cave");
  invariant(cave, "launch-native has env");
  log(opts, `cave location: "${cave.installLocation}/${cave.installFolder}"`);

  invariant(credentials, "launch-native has credentials");

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game});
  invariant(game, "was able to fetch game properly");

  let {isolateApps} = opts.preferences;
  const appPath = pathmaker.appPath(cave);
  let exePath: string;

  const manifestPath = ospath.join(appPath, ".itch.toml");
  const hasManifest = await sf.exists(manifestPath);
  if (opts.manifestAction) {
    const action = opts.manifestAction;
    // sandbox opt-in ?
    if (action.sandbox) {
      isolateApps = true;
    }

    log(opts, `manifest action picked: ${JSON.stringify(action, null, 2)}`);
    const actionPath = action.path;
    exePath = ospath.join(appPath, actionPath);
  } else {
    log(opts, "no manifest action picked");
  }

  if (!exePath) {
    const pokerOpts = Object.assign({}, opts, {
      appPath,
    });
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
      cave = globalMarket.getEntities("caves")[cave.id];
      return await launch(out, Object.assign({}, opts, {
        cave,
        hailMary: true,
      }));
    }
  }

  if (!exePath) {
    const err = new Error(`No executables found (${hasManifest ? "with" : "without"} manifest)`);
    (err as any).reason = ["game.install.no_executables_found"];
    throw err;
  }

  if (/\.jar$/i.test(exePath)) {
    log(opts, "launching .jar, this will fail if no system JRE is installed");
    args = [
      "-jar", exePath, ...args,
    ];
    exePath = "java";
  }

  const platform = os.platform();
  log(opts, `executing '${exePath}' on '${platform}' with args '${args.join(" ")}'`);
  const argString = map(args, spawn.escapePath).join(" ");

  if (isolateApps) {
    const checkRes = await sandbox.check();
    if (checkRes.errors.length > 0) {
      throw new Error(`error(s) while checking for sandbox: ${checkRes.errors.join(", ")}`);
    }

    if (checkRes.needs.length > 0) {
      const itchPlatform = os.itchPlatform();

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
            action: actions.openUrl((urls as any)[`${itchPlatform}SandboxSetup`]),
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

  let fullExec = exePath;
  if (platform === "darwin") {
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

      const sandboxOpts = Object.assign({}, opts, {
        game,
        appPath,
        exePath,
        fullExec,
        argString,
        isBundle,
      });

      await sandbox.within(sandboxOpts, async function ({fakeApp}) {
        await doSpawn(fullExec, `open -W ${spawn.escapePath(fakeApp)}`, env, out, opts);
      });
    } else {
      log(opts, "no app isolation");
      if (isBundle) {
        await doSpawn(fullExec, `open -W ${spawn.escapePath(exePath)} --args ${argString}`, env, out, opts);
      } else {
        await doSpawn(fullExec, `${spawn.escapePath(exePath)} ${argString}`, env, out, opts);
      }
    }
  } else if (platform === "win32") {
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
      const grantRes = await spawn.getOutput({
        command: "icacls",
        args: [ grantPath, "/grant", playerUsername + ":F", "/T", "/Q", "/c" ],
        logger: opts.logger,
      });
      log(opts, `grant output:\n${grantRes}`);

      cmd = `isolate ${cmd}`;
    } else {
      log(opts, "no app isolation");
    }
    await doSpawn(exePath, cmd, env, out, opts);

    if (isolateApps) {
      const denyRes = await spawn.getOutput({
        command: "icacls",
        args: [ grantPath, "/deny", playerUsername + ":F", "/T", "/Q", "/c" ],
        logger: opts.logger,
      });
      log(opts, `deny output:\n${denyRes}`);
    }
  } else if (platform === "linux") {
    let cmd = `${spawn.escapePath(exePath)}`;
    if (argString.length > 0) {
      cmd += ` ${argString}`;
    }
    if (isolateApps) {
      log(opts, "generating firejail profile");
      const sandboxProfilePath = ospath.join(appPath, ".itch", "isolate-app.profile");

      const sandboxSource = linuxSandboxTemplate;
      await sf.writeFile(sandboxProfilePath, sandboxSource);

      cmd = `firejail "--profile=${sandboxProfilePath}" -- ${cmd}`;
      await doSpawn(exePath, cmd, env, out, opts);
    } else {
      log(opts, "no app isolation");
      await doSpawn(exePath, cmd, env, out, opts);
    }
  } else {
    throw new Error(`unsupported platform: ${platform}`);
  }
}

async function doSpawn (exePath: string, fullCommand: string, env: IEnvironment, emitter: EventEmitter,
                        opts: IStartTaskOpts) {
  log(opts, `spawn command: ${fullCommand}`);

  const cwd = ospath.dirname(exePath);
  log(opts, `working directory: ${cwd}`);

  const args = shellQuote.parse(fullCommand);
  const command = args.shift();
  log(opts, `command: ${command}`);
  log(opts, `args: ${JSON.stringify(args, null, 2)}`);
  log(opts, `env keys: ${JSON.stringify(Object.keys(env), null, 2)}`);

  let spawnEmitter = emitter;
  const platform = os.platform();
  if (platform === "darwin") {
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

  const code = await spawn({
    command,
    args,
    emitter: spawnEmitter,
    onToken: (tok) => log(opts, `out: ${tok}`),
    onErrToken: (tok) => log(opts, `err: ${tok}`),
    opts: {
      env: Object.assign({}, process.env, env),
      cwd,
    },
  });

  if (code !== 0) {
    const error = `process exited with code ${code}`;
    throw new Crash({exePath, error});
  }
  return "child completed successfully";
}

function isAppBundle (exePath: string) {
  return /\.app\/?$/.test(exePath.toLowerCase());
}
