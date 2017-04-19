
import {EventEmitter} from "events";

import spawn from "../../util/spawn";
import os from "../../util/os";

import mklog from "../../util/log";
const log = mklog("install/msi");

import {IStartTaskOpts} from "../../types";

const self = {
  logPath: function (msiPath: string) {
    return `${msiPath}.log.txt`;
  },

  args: function (operation: string, msiPath: string, targetPath: string) {
    const logPath = self.logPath(msiPath);

    return [
      "--msiexec",
      operation,
      msiPath,
      targetPath,
      logPath,
    ];
  },

  install: async function (out: EventEmitter, opts: IStartTaskOpts): Promise<void> {
    out.emit("progress", {progress: -1});

    if (os.platform() !== "win32") {
      throw new Error("MSI files are only supported on Windows");
    }

    const archivePath = opts.archivePath;
    const destPath = opts.destPath;
    const logger = opts.logger;

    const msiCmd = opts.elevated ? "--elevated-install" : "--install";

    const code = await spawn({
      command: "elevate.exe",
      args: self.args(msiCmd, archivePath, destPath),
      onToken: (token) => log(opts, token),
      onErrToken: (token) => log(opts, token),
      logger,
    });

    if (code !== 0) {
      if (code === 1603 && !opts.elevated) {
        log(opts, "msi installer exited with 1603, retrying elevated");
        return await self.install(out, {...opts, elevated: true });
      }
      throw new Error(`msi installer exited with code ${code}`);
    }

    log(opts, "msi installer completed successfully");
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts): Promise<void> {
    if (os.platform() !== "win32") {
      throw new Error("MSI files are only supported on Windows");
    }

    out.emit("progress", {progress: -1});

    const archivePath = opts.archivePath;
    const destPath = opts.destPath;
    const logger = opts.logger;

    const msiCmd = opts.elevated ? "--elevated-uninstall" : "--uninstall";
    const code = await spawn({
      command: "elevate",
      args: self.args(msiCmd, archivePath, destPath),
      onToken: (token) => log(opts, token),
      onErrToken: (token) => log(opts, token),
      logger,
    });

    if (code !== 0) {
      if (code === 1603 && !opts.elevated) {
        log(opts, "msi uninstaller exited with 1603, retrying elevated");
        return await self.uninstall(out, {...opts, elevated: true });
      }
      throw new Error(`msi uninstaller exited with code ${code}`);
    }

    log(opts, "msi uninstaller completed successfully");
  },
};

export default self;
