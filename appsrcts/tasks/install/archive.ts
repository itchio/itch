
import {EventEmitter} from "events";

import subprogress from "../../util/subprogress";

import butler from "../../util/butler";
import extract from "../../util/extract";
import deploy, {IDeployOpts} from "../../util/deploy";

import core from "./core";

import mklog from "../../util/log";
const log = mklog("installers/archive");

import {IStartTaskOpts, IInstallerCache} from "../../types/db";
import {IProgressInfo} from "../../types/progress";

const self = {
  retrieveCachedType: function (opts: IStartTaskOpts) {
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

  cacheType: function (opts: IStartTaskOpts, type: string) {
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

    const extractOpts = Object.assign({}, opts, {
      emitter: out,
      onProgress: extractOnProgress,
      archivePath: opts.archivePath,
      destPath: stagePath,
    });
    await extract.extract(extractOpts);

    log(opts, `extracted all files ${archivePath} into staging area`);

    const deployOpts = Object.assign({}, opts, {
      onProgress: deployOnProgress,
      stagePath,
      destPath: opts.destPath,
    }) as IDeployOpts;

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
    if (installerName) {
      log(opts, `have nested installer type ${installerName}, running...`);
      const coreOpts = Object.assign({}, opts, {
        installerName,
      });
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
    const sniffOpts = Object.assign({}, opts, {archivePath: onlyFile, disableCache: true});

    let installerName: string;
    try {
      installerName = await core.sniffType(sniffOpts);
    } catch (err) {
      log(opts, `not a recognized installer type: ${onlyFile}`);
      return null;
    }

    self.cacheType(opts, installerName);
    log(opts, `found a '${installerName}': ${onlyFile}`);
    const nestedOpts = Object.assign({}, opts, sniffOpts);
    log(opts, `installing it with sniff opts: ${JSON.stringify(sniffOpts, null, 2)}`);
    await core.install(out, nestedOpts);

    return {deployed: true};
  },
};

export default self;
