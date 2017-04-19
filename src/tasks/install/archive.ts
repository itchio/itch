
import {EventEmitter} from "events";

import subprogress from "../../util/subprogress";

import butler from "../../util/butler";
import extract from "../../util/extract";
import deploy, {IDeployOpts} from "../../util/deploy";

import core from "./core";

import mklog from "../../util/log";
const log = mklog("install/archive");

import {IStartTaskOpts, IInstallerCache} from "../../types";
import {IProgressInfo, InstallerType} from "../../types";

const self = {
  retrieveCachedType: function (opts: IStartTaskOpts): InstallerType {
    const {cave} = opts;
    if (!cave) {
      return;
    }
    log(opts, `got cave: ${JSON.stringify(cave, null, 2)}`);

    const {archiveNestedCache = {}} = cave;
    const type = archiveNestedCache[cave.uploadId];
    if (!type) {
      return;
    }

    log(opts, `found cached installer type ${type}`);

    if (core.validInstallers.indexOf(type) === -1) {
      log(opts, `invalid installer type stored: ${type} - discarding`);
      return null;
    }

    return type;
  },

  cacheType: function (opts: IStartTaskOpts, type: InstallerType) {
    const cave = opts.cave;
    if (!cave) {
      return;
    }

    const archiveNestedCache = {} as IInstallerCache;
    archiveNestedCache[cave.uploadId] = type;
    const {globalMarket} = opts;
    globalMarket.saveEntity("caves", cave.id, {archiveNestedCache});
  },

  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const archivePath = opts.archivePath;

    const onProgress = (ev: IProgressInfo) => out.emit("progress", ev);
    const extractOnProgress = subprogress(onProgress, 0, 0.8);
    const deployOnProgress = subprogress(onProgress, 0.8, 1);

    const stagePath = opts.archivePath + "-stage";
    await butler.wipe(stagePath);
    await butler.mkdir(stagePath);

    log(opts, `extracting archive '${archivePath}' to '${stagePath}'`);

    const extractOpts = {
      ...opts,
      emitter: out,
      onProgress: extractOnProgress,
      archivePath: opts.archivePath,
      destPath: stagePath,
    };
    await extract.extract(extractOpts);

    log(opts, `extracted all files ${archivePath} into staging area`);

    const deployOpts: IDeployOpts = {
      ...opts,
      onProgress: deployOnProgress,
      stagePath,
      destPath: opts.destPath,
    };

    deployOpts.onSingle = async function (onlyFile) {
      return await self.handleNested(out, opts, onlyFile);
    };

    await deploy.deploy(deployOpts);

    log(opts, "wiping stage...");
    await butler.wipe(stagePath);
    log(opts, "done wiping stage");

    return {status: "ok"};
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const destPath = opts.destPath;

    const installerName = self.retrieveCachedType(opts);
    if (installerName && installerName !== "archive") {
      log(opts, `have nested installer type ${installerName}, running...`);
      const coreOpts = {
        ...opts,
        installerName,
      };
      await core.uninstall(out, coreOpts);
    } else {
      log(opts, `wiping directory ${destPath}`);
      await butler.wipe(destPath);
    }

    log(opts, "cleaning up cache");
    self.cacheType(opts, null);
  },

  handleNested: async function (out: EventEmitter, opts: IStartTaskOpts, onlyFile: string) {
    // zipped installers need love too
    const sniffOpts = {
      ...opts,
      archivePath: onlyFile,
      disableCache: true,
    };

    let installerName: InstallerType;
    try {
      installerName = await core.sniffType(sniffOpts);
    } catch (err) {
      log(opts, `not a recognized installer type: ${onlyFile}`);
      return null;
    }

    self.cacheType(opts, installerName);
    log(opts, `found a '${installerName}': ${onlyFile}`);
    const nestedOpts = { ...opts, ...sniffOpts };
    await core.install(out, nestedOpts);

    return {deployed: true};
  },
};

export default self;
