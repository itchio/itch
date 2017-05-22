
import {EventEmitter} from "events";

import * as invariant from "invariant";

import fnout, {SniffResult} from "fnout";
import butler from "../../util/butler";
import spawn from "../../os/spawn";

import rootLogger from "../../logger";
const logger = rootLogger.child("install/core");

import {IInstallerCache, InstallerType, IStartTaskOpts} from "../../types";

type InstallOperation = "install" | "uninstall";

class UnhandledFormat extends Error {
  constructor (archivePath: string) {
    super(`don't know how to handle ${archivePath}`);
  }
}

/** maps file extensions to installer types */
interface IInstallerExtensionMap {
  [ext: string]: InstallerType;
}

const self = {
  UnhandledFormat,

  validInstallers: ["archive", "msi", "exe"],

  installerForExt: {
    // Generic archives
    "zip": "archive",
    "gz": "archive",
    "bz2": "archive",
    "7z": "archive",
    "tar": "archive",
    "xz": "archive",
    "rar": "archive",
    // Apple disk images (DMG)
    "dmg": "dmg",
    // Microsoft packages
    "msi": "msi",
    // Inno setup, NSIS
    "exe": "exe",
    // Books!
    "pdf": "naked",
    // Known naked
    "jar": "naked",
    "unitypackage": "naked",
    "naked": "naked",
    // some html games provide a single raw html file
    "html": "naked",
  } as IInstallerExtensionMap,

  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    return await self.operate(out, opts, "install");
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    return await self.operate(out, opts, "uninstall");
  },

  cacheType: function (opts: IStartTaskOpts, installerName: InstallerType) {
    const {cave, upload} = opts;
    // FIXME: db
    const globalMarket: any = null;
    if (!cave) {
      return;
    }

    invariant(typeof installerName === "string", "cacheType needs string installerName");
    invariant(typeof upload === "object", "cacheType needs object upload");
    invariant(typeof upload.id === "number", "cacheType needs int upload.id");

    const installerCache = {} as IInstallerCache;
    installerCache[upload.id] = installerName;
    globalMarket.saveEntity("caves", cave.id, {installerCache});
  },

  retrieveCachedType: function (opts: IStartTaskOpts) {
    const cave = opts.cave;
    if (!cave) {
      return null;
    }

    const {archivePath} = opts;
    if (!archivePath) {
      logger.warn("no archive available, can\'t retrieve cached type");
      return;
    }

    logger.info(`retrieving installer type of ${archivePath} from cache`);
    const installerCache = cave.installerCache || {};
    const installerName = installerCache[cave.uploadId];

    if (self.validInstallers.indexOf(installerName) === -1) {
      logger.warn(`invalid installer name stored: ${installerName} - discarding`);
      return null;
    }

    return installerName;
  },

  sniffType: async function (opts: IStartTaskOpts): Promise<InstallerType> {
    const {archivePath} = opts;
    if (!archivePath) {
      logger.warn('no archive available, unable to sniff type, going with "archive" uninstaller');
      return "archive";
    }

    let type: SniffResult;
    if (/.(jar|unitypackage)$/i.test(archivePath)) {
      logger.info(`known naked type for ${archivePath}`);
      type = {
        ext: "naked",
      };
    }

    if (!type) {
      type = await fnout.path(archivePath);
      logger.info(`sniffed type ${JSON.stringify(type)} for ${archivePath}`);
    }

    if (!type) {
      throw new UnhandledFormat(archivePath);
    }

    let installerName = self.installerForExt[type.ext];
    if (!installerName) {
      const code = await spawn({
        command: "lsar",
        args: [archivePath],
      });

      if (code === 0) {
        logger.info("unarchiver saves the day! it is an archive.");
        installerName = "archive";
      } else {
        try {
          const fileResult = await butler.file({path: archivePath});
          if (fileResult.type === "zip") {
            logger.info("butler saves the day! it's a file that ends with a zip");
            installerName = "archive";
          } else {
            throw new Error(`unhandled file type ${fileResult.type || "unknown"}`);
          }
        } catch (e) {
          if (type.macExecutable || type.linuxExecutable) {
            logger.info("tis an executable, going with naked");
            installerName = "naked";
          } else {
            throw new UnhandledFormat(`${archivePath} of type ${JSON.stringify(type)}`);
          }
        }
      }
    }

    if (!opts.disableCache) {
      self.cacheType(opts, installerName);
    }
    return installerName;
  },

  operate: async function (out: EventEmitter, opts: IStartTaskOpts, operation: InstallOperation) {
    const {archivePath} = opts;
    let {installerName} = opts;

    if (!installerName && !opts.disableCache) {
      installerName = self.retrieveCachedType(opts);
    }

    if (installerName) {
      logger.info(`using cached installer type ${installerName} for ${archivePath}`);
    } else {
      installerName = await self.sniffType(opts);
    }

    const installer = require(`./${installerName}`).default;
    await installer[operation](out, opts);
  },
};

export default self;
