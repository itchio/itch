
import {EventEmitter} from "events";

import spawn from "../../util/spawn";
import findUninstallers from "./find-uninstallers";

import {Transition} from "../errors";
import blessing from "./blessing";
import butler from "../../util/butler";

import mklog from "../../util/log";
const log = mklog("install/nsis");

import {IStartTaskOpts} from "../../types";

// NSIS docs: http://nsis.sourceforge.net/Docs/Chapter3.html
// When ran without elevate, some NSIS installers will silently fail.
// So, we run them with elevate all the time.

const self = {
  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    await blessing(out, opts);
    out.emit("progress", {progress: -1});

    let inst = opts.archivePath;
    const destPath = opts.destPath;

    let removeAfterUsage = false;

    if (!/\.exe$/i.test(inst)) {
      // copy to temporary file, otherwise windows will refuse to open them
      // cf. https://github.com/itchio/itch/issues/322
      inst += ".exe";
      await butler.ditto(opts.archivePath, inst, {
        ...opts,
        emitter: out,
      });
      removeAfterUsage = true;
    }

    const code = await spawn({
      command: "elevate.exe",
      args: [
        inst,
        "/S", // run the installer silently
        "/NCRC", // disable CRC-check, we do hash checking ourselves
        `/D=${destPath}`,
      ],
      onToken: (tok) => log(opts, `${inst}: ${tok}`),
    });

    if (removeAfterUsage) {
      await butler.wipe(inst, {
        ...opts,
        emitter: out,
      });
    }

    if (code !== 0) {
      throw new Error(`elevate / nsis installer exited with code ${code}`);
    }

    log(opts, "elevate/nsis installer completed successfully");
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    out.emit("progress", {progress: -1});

    const destPath = opts.destPath;
    const uninstallers = await findUninstallers(destPath);

    if (uninstallers.length === 0) {
      log(opts, "could not find an uninstaller");
      return;
    }

    for (const unins of uninstallers) {
      log(opts, `running nsis uninstaller ${unins}`);
      const spawnOpts = {
        command: "elevate.exe",
        args: [
          unins,
          "/S", // run the uninstaller silently
          `_?=${destPath}`, // specify uninstallation path
        ],
        opts: {cwd: destPath},
        onToken: (tok: string) => log(opts, `${unins}: ${tok}`),
      };
      const code = await spawn(spawnOpts);
      log(opts, `elevate / nsis uninstaller exited with code ${code}`);

      if (code !== 0) {
        const reason = "uninstaller failed, cancelling uninstallation";
        throw new Transition({to: "idle", reason});
      }
    }
  },
};

export default self;
