
import {EventEmitter} from "events";

import * as StreamSearch from "streamsearch";
import * as os from "../../os";
import sf from "../../os/sf";
import spawn from "../../os/spawn";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "install/exe"});

import {partial} from "underscore";

import {IStartTaskOpts, IInstallerCache, InstallerType} from "../../types";

/** Map search string to installer format */
interface INeedles {
  [searchString: string]: InstallerType;
}

let self = {
  validInstallers: ["inno", "nsis", "air"],

  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    let installer = await self.findInstaller(opts);
    await installer.install(out, opts);
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    let installer = await self.findInstaller(opts);
    await installer.uninstall(out, opts);
  },

  findInstaller: async function (opts: IStartTaskOpts) {
    if (os.platform() !== "win32") {
      throw new Error("Exe installers are only supported on Windows");
    }

    let archivePath = opts.archivePath;
    let type = self.retrieveCachedType(opts);

    if (type) {
      logger.info(`using cached installer type ${type} for ${archivePath}`);
    } else {
      type = await self.identify(opts);

      if (type) {
        logger.info(`found exe installer type ${type} for ${archivePath}`);
        self.cacheType(opts, type);
      } else {
        // don't cache that, we might find better later
        logger.info(`falling back to 'naked exe' for ${archivePath}`);
        type = "naked";
      }
    }

    return require(`./${type}`).default;
  },

  retrieveCachedType: function (opts: IStartTaskOpts) {
    let cave = opts.cave;
    if (!cave) {
      return;
    }
    logger.info(`got cave: ${JSON.stringify(cave, null, 2)}`);

    let installerExeCache = cave.installerExeCache || {};
    let type = installerExeCache[cave.uploadId];
    logger.info(`found cached installer type ${type}`);

    if (self.validInstallers.indexOf(type) === -1) {
      logger.warn(`invalid exe installer type stored: ${type} - discarding`);
      return null;
    }

    return type;
  },

  cacheType: function (opts: IStartTaskOpts, type: InstallerType) {
    let cave = opts.cave;
    if (!cave) {
      return;
    }

    let installerExeCache = {} as IInstallerCache;
    installerExeCache[cave.uploadId] = type;

    // FIXME: db
    const globalMarket: any = null;
    globalMarket.saveEntity("caves", cave.id, {installerExeCache});
  },

  identify: async function (opts: IStartTaskOpts): Promise<InstallerType> {
    let kind = await self.builtinSniff(opts, self.builtinNeedles);
    if (!kind) {
      kind = await self.externalSniff(opts, self.externalNeedles);
    }

    return kind;
  },

  builtinSniff: async function (opts: IStartTaskOpts, needles: INeedles): Promise<InstallerType> {
    const {archivePath} = opts;
    let result: InstallerType = null;
    let searches: any[] = [];

    let onInfo = (
        needle: string, format: InstallerType, isMatch: boolean,
        data: Buffer, start: number, end: number) => {
      if (!isMatch) {
        return;
      }
      logger.info(`builtinSniff: found needle ${needle}`);
      result = format;
    };

    for (const needle of Object.keys(needles)) {
      const format = needles[needle];
      const search = new StreamSearch(needle);
      search.on("info", partial(onInfo, needle, format));
      searches.push(search);
    }

    const reader = sf.createReadStream(archivePath, {encoding: "binary"});
    reader.on("data", (buf: Buffer) => {
      for (let search of searches) {
        search.push(buf);
      }
    });

    await sf.promised(reader);
    return result;
  },

  builtinNeedles: {
    // Boyer-Moore - longer strings means search is more efficient. That said,
    // we don't really use it to skip forward, it just allows us not to scan
    // entire buffers nodes gives us while reading the whole file
    "Inno Setup Setup Data": "inno",
    "Nullsoft.NSIS.exehead": "nsis",
    "META-INF/AIR/application.xml": "air",
  } as INeedles,

  externalSniff: async function (opts: IStartTaskOpts, needles: INeedles): Promise<InstallerType> {
    const {archivePath} = opts;

    let detail: string;

    try {
      const contents = await spawn.getOutput({
        command: "lsar",
        args: ["-j", archivePath],
      });
      const lsarInfo = JSON.parse(contents);
      detail = lsarInfo.lsarFormatName;
    } catch (e) {
      logger.info(`Could not run external sniff: ${e.message}`);
    }

    logger.info(`lsar format name: '${detail}'`);

    if (!detail) {
      return null;
    }

    const format = needles[detail];
    if (format) {
      logger.info(`recognized archive format ${format} (from ${detail})`);
      return format;
    }

    return null;
  },

  externalNeedles: {
    "Self-extracting CAB": "archive",
  } as INeedles,
};

export default self;
