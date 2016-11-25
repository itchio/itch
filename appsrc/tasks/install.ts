
import {EventEmitter} from "events";

import * as invariant from "invariant";
import * as uuid from "uuid";

import {Transition} from "./errors";

import pathmaker from "../util/pathmaker";
import sf from "../util/sf";
import mklog from "../util/log";
const log = mklog("tasks/install");

import core from "./install/core";
import {findWhere} from "underscore";

import {IStartTaskOpts} from "../types";
import {IProgressInfo} from "../types";

function defaultInstallLocation () {
  const store = require("../store").default;
  const {defaultInstallLocation} = store.getState().preferences;
  return defaultInstallLocation;
}

export default async function start (out: EventEmitter, opts: IStartTaskOpts) {
  invariant(opts.credentials, "install must have credentials");
  invariant(opts.globalMarket, "install must have a globalMarket");
  invariant(opts.market, "install must have a market");
  invariant(opts.archivePath, "install must have a archivePath");
  invariant(opts.game, "install must have a game");
  invariant(opts.upload, "install must have an upload");
  const {market, credentials, globalMarket, archivePath, downloadKey, game, upload,
    installLocation = defaultInstallLocation(), handPicked} = opts;

  const experimentalZeroExtract = false && !!opts.upload.buildId;

  let checkTimestamps = true;

  const grabCave = () => findWhere(globalMarket.getEntities("caves"), {gameId: game.id});
  let {cave = grabCave()} = opts;

  if (opts.reinstall) {
    checkTimestamps = false;
  }

  if (!cave) {
    invariant(!opts.reinstall, "need a cave for reinstall");

    let installFolder = pathmaker.sanitize(game.title);

    cave = {
      id: uuid.v4(),
      gameId: game.id,
      game,
      uploadId: upload.id,
      uploads: {[upload.id]: upload},
      installLocation,
      installFolder,
      pathScheme: 2, // see pathmaker
      handPicked,
      fresh: true,
      downloadKey,
    };

    if (!opts.reinstall && !experimentalZeroExtract) {
      const installFolderExists = async function () {
        const fullPath = pathmaker.appPath(cave);
        return await sf.exists(fullPath);
      };

      let seed = 2;
      // if you need more than 1200 games with the exact same name... you don't.
      while (await installFolderExists() && seed < 1200) {
        cave.installFolder = `${installFolder} ${seed++}`;
      }
    }

    globalMarket.saveEntity("caves", cave.id, cave);
  }

  if (cave.buildUserVersion && upload.build && upload.build.userVersion) {
    log(opts, `upgrading from version ${cave.buildUserVersion} => version ${upload.build.userVersion}`);
  } else {
    log(opts, `upgrading from build id ${cave.buildId} => build id ${upload.buildId}`);
  }

  market.saveEntity("games", String(game.id), game);

  let amtime: number;
  if (experimentalZeroExtract) {
    amtime = Date.parse(upload.build.updatedAt);
  } else {
    let destPath = pathmaker.appPath(cave);

    let archiveStat: any;
    try {
      archiveStat = await sf.lstat(archivePath);
    } catch (e) {
      log(opts, "where did our archive go? re-downloading...");
      throw new Transition({to: "download", reason: "missing-download"});
    }

    let imtime = Date.parse(cave.installedArchiveMtime);
    amtime = archiveStat.mtime;
    log(opts, `comparing mtimes, installed = ${imtime}, archive = ${amtime}`);

    if (checkTimestamps && imtime && !(amtime > imtime)) {
      log(opts, "archive isn\'t more recent, nothing to install");
      return {caveId: cave.id};
    }

    let coreOpts = Object.assign({}, opts, {
      cave,
      destPath,
      onProgress: (ev: IProgressInfo) => out.emit("progress", ev),
    });

    globalMarket.saveEntity("caves", cave.id, {launchable: false});
    await core.install(out, coreOpts);
  }

  globalMarket.saveEntity("caves", cave.id, {
    game,
    installedBy: {
      id: credentials.me.id,
      username: credentials.me.username,
    },
    downloadKey,
    handPicked,
    launchable: true,
    installedArchiveMtime: amtime,
    installedAt: Date.now(),
    uploadId: upload.id,
    channelName: upload.channelName,
    buildId: upload.buildId,
    buildUserVersion: upload.build && upload.build.userVersion,
    uploads: {[upload.id]: upload},
    fresh: false,
  });

  return {caveId: cave.id};
}
