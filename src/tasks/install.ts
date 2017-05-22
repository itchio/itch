
import {EventEmitter} from "events";

import * as invariant from "invariant";
import * as uuid from "uuid";

import {Transition} from "./errors";

import * as paths from "../os/paths";
import sf from "../os/sf";
import {Stats} from "fs";

import rootLogger from "../logger";
const logger = rootLogger.child("install");

import core from "./install/core";
import {findWhere} from "underscore";

import {IStartTaskOpts, IProgressInfo, ICaveRecord, IStore} from "../types";

import store from "../store/metal-store";

function defaultInstallLocation (store: IStore) {
  const {defaultInstallLocation} = store.getState().preferences;
  return defaultInstallLocation;
}

export default async function start (out: EventEmitter, opts: IStartTaskOpts) {
  invariant(opts.credentials, "install must have credentials");
  if (!opts.becauseHeal) {
    invariant(opts.archivePath, "install must have a archivePath");
  }
  invariant(opts.game, "install must have a game");
  invariant(opts.upload, "install must have an upload");

  const {credentials, archivePath, downloadKey, game, upload,
    installLocation = defaultInstallLocation(store), handPicked, becauseHeal} = opts;

  // FIXME: db
  const globalMarket: any = null;
  const market: any = null;

  const grabCave = () => findWhere(globalMarket.getEntities("caves"), {gameId: game.id});
  let {cave = grabCave()} = opts;

  if (!cave) {
    invariant(!opts.reinstall, "need a cave for reinstall");

    let installFolder = paths.sanitize(game.title);

    cave = {
      id: uuid.v4(),
      gameId: game.id,
      game,
      uploadId: upload.id,
      uploads: {[upload.id]: upload},
      installLocation,
      installFolder,
      pathScheme: paths.PathScheme.MODERN_SHARED,
      handPicked,
      fresh: true,
      downloadKey,
    } as ICaveRecord;

    if (!opts.reinstall && !becauseHeal) {
      const installFolderExists = async function () {
        const fullPath = paths.appPath(cave, store.getState().preferences);
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
    logger.info(`upgrading from version ${cave.buildUserVersion} => version ${upload.build.userVersion}`);
  } else {
    logger.info(`upgrading from build id ${cave.buildId} => build id ${upload.buildId}`);
  }

  market.saveEntity("games", String(game.id), game);

  let amtime: number;
  if (becauseHeal) {
    amtime = Date.parse(upload.build.updatedAt);
  } else {
    let destPath = paths.appPath(cave, store.getState().preferences);

    let archiveStat: Stats;
    try {
      archiveStat = await sf.lstat(archivePath);
    } catch (e) {
      logger.warn("archive disappeared, redownloading...");
      throw new Transition({to: "download", reason: "missing-download"});
    }

    let imtime = Date.parse(cave.installedArchiveMtime);
    amtime = Number(archiveStat.mtime);
    logger.info(`installed mtime = ${imtime}, archive mtime = ${amtime}`);

    let coreOpts = {
      ...opts,
      cave,
      destPath,
      onProgress: (ev: IProgressInfo) => out.emit("progress", ev),
    };

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
    installedArchiveMtime: new Date(amtime).toString(),
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
