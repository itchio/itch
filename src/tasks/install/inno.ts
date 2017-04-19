
import {EventEmitter} from "events";

import spawn from "../../util/spawn";
import findUninstallers from "./find-uninstallers";

import blessing from "./blessing";
import {Transition} from "../errors";

import mklog from "../../util/log";
const log = mklog("install/inno");

import {IStartTaskOpts} from "../../types";

// InnoSetup docs: http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline

const self = {
  logPath: function (operation: string, installerPath: string) {
    return `${installerPath}.${operation}.log.txt`;
  },

  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    await blessing(out, opts);

    out.emit("progress", {progress: -1});

    const archivePath = opts.archivePath;
    const destPath = opts.destPath;
    const logPath = self.logPath("i", archivePath);

    const spawnOpts = {
      command: archivePath,
      args: [
        "/VERYSILENT", // run the installer silently
        "/SUPPRESSMSGBOXES", // don't show any dialogs
        "/NOCANCEL", // no going back
        "/NORESTART", // prevent installer from restarting system
        `/LOG=${logPath}`, // store log on disk
        `/DIR=${destPath}`, // install in apps directory if possible
      ],
      onToken: (token: string) => log(opts, token),
    };
    const code = await spawn(spawnOpts);
    log(opts, `inno installer exited with code ${code}`);
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    out.emit("progress", {progress: -1});

    const destPath = opts.destPath;
    const uninstallers = await findUninstallers(destPath);

    if (uninstallers.length === 0) {
      log(opts, "could not find an uninstaller");
      return;
    }

    for (let unins of uninstallers) {
      log(opts, `running inno uninstaller ${unins}`);
      let spawnOpts = {
        command: unins,
        args: [
          "/VERYSILENT", // be vewwy vewwy quiet
        ],
        opts: {cwd: destPath},
        onToken: (tok: string) => log(opts, `${unins}: ${tok}`),
      };
      let code = await spawn(spawnOpts);
      log(opts, `inno uninstaller exited with code ${code}`);

      if (code !== 0) {
        const reason = "uninstaller failed, cancelling uninstallation";
        throw new Transition({to: "idle", reason});
      }
    }
  },
};

export default self;
