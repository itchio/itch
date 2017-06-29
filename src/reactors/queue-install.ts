import * as uuid from "uuid";

import Context from "../context";

import * as actions from "../actions";

import { ICave } from "../db/models/cave";
import { toJSONField } from "../db/json-field";
import { IQueueInstallOpts, IStore } from "../types";

import * as paths from "../os/paths";
import * as sf from "../os/sf";
import { currentRuntime } from "../os/runtime";
import { Logger } from "../logger";

import { coreInstall } from "./install-managers/core";
import asTask from "./tasks/as-task";

function defaultInstallLocation(store: IStore) {
  const { defaultInstallLocation } = store.getState().preferences;
  return defaultInstallLocation;
}

export async function queueInstall(
  ctx: Context,
  logger: Logger,
  opts: IQueueInstallOpts,
) {
  const installLocation =
    opts.installLocation || defaultInstallLocation(ctx.store);

  let cave: ICave;

  const { caveId, game, reason } = opts;

  logger.info(`in queueInstall, game = ${JSON.stringify(game, null, 2)}`);

  if (caveId) {
    cave = ctx.db.caves.findOneById(caveId);
    if (!cave) {
      throw new Error("Couldn't find cave to operate on");
    }
  } else {
    if (reason === "reinstall") {
      throw new Error("Can't reinstall without a cave now can we.");
    }

    let installFolder = paths.sanitize(game.title);

    const { handPicked, upload } = opts;

    cave = ({
      id: uuid.v4(),
      gameId: game.id,
      game,
      upload: toJSONField(upload),
      installLocation,
      installFolder,
      pathScheme: paths.PathScheme.MODERN_SHARED,
      handPicked,
    } as Partial<ICave>) as ICave;

    if (reason === "heal") {
      const { preferences } = ctx.store.getState();
      const installFolderExists = async function() {
        const fullPath = paths.appPath(cave, preferences);
        return await sf.exists(fullPath);
      };

      let seed = 2;
      // if you need more than 1200 games with the exact same name... you don't.
      while ((await installFolderExists()) && seed < 1200) {
        cave.installFolder = `${installFolder} ${seed++}`;
      }
    }

    // TODO: take a good long think about this - what happens if the install stops
    // halfway through? the `fresh` field was there for that originally, but now it's not.
    // I think that's why a bunch of folks have empty install folders & can't launch,
    // the install simply didn't happen. Should we even need to persist the cave at this point?
    // my vote is no.
    ctx.db.saveOne("caves", cave.id, cave);
  }

  const { upload } = opts;

  if (cave.buildUserVersion && upload.build && upload.build.userVersion) {
    logger.info(
      `upgrading from version ${cave.buildUserVersion} => version ${upload.build
        .userVersion}`,
    );
  } else {
    logger.info(
      `upgrading from build id ${cave.buildId} => build id ${upload.buildId}`,
    );
  }

  ctx.db.saveOne("games", String(game.id), game);

  const prefs = ctx.store.getState().preferences;

  let destPath = paths.appPath(cave, prefs);
  let archivePath = paths.downloadPath(upload, prefs);

  if (!await sf.exists(archivePath)) {
    const { handPicked } = opts;

    logger.warn("archive disappeared, redownloading...");
    ctx.store.dispatch(
      actions.queueDownload({
        caveId,
        game,
        handPicked,
        upload,
        totalSize: upload.size,
        incremental: false,
        reason: "install",
        upgradePath: null,
      }),
    );
    return;
  }

  // TODO: check available disk space
  // have a check at download too, why not.

  // TODO: also, if we do run into `ENOSPC`,
  // show a dialog or something. And offer some help
  // will ya, there's people with tiny tiny SSDs!

  const runtime = currentRuntime();

  await coreInstall({
    ...opts,
    ctx,
    runtime,
    logger,
    destPath,
    archivePath,
    caveId: cave.id,
  });

  ctx.db.saveOne("caves", cave.id, {
    installedAt: new Date(),
    uploadId: upload.id,
    channelName: upload.channelName,
    buildId: upload.buildId,
    buildUserVersion: upload.build && upload.build.userVersion,
    upload,
    fresh: false,
  });
}

import { DB } from "../db";
import { Watcher } from "./watcher";

export default async function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueInstall, async (store, action) => {
    const { game, caveId } = action.payload;

    await asTask({
      name: "install",
      gameId: game.id,
      caveId,
      db,
      store,
      work: (ctx, logger) => queueInstall(ctx, logger, action.payload),
    });
  });
}
