import uuid from "../util/uuid";

import Context from "../context";

import * as actions from "../actions";
import * as url from "url";

import { ICave, ICaveLocation } from "../db/models/cave";
import { IGame } from "../db/models/game";
import { toJSONField } from "../db/json-field";
import { IQueueInstallOpts, IStore, isCancelled } from "../types";

import * as paths from "../os/paths";
import * as sf from "../os/sf";
import { currentRuntime } from "../os/runtime";
import { Logger } from "../logger";

import { coreInstall } from "../install-managers/common/core";
import asTask from "./tasks/as-task";

function defaultInstallLocation(store: IStore) {
  const { defaultInstallLocation } = store.getState().preferences;
  return defaultInstallLocation;
}

export async function queueInstall(
  ctx: Context,
  parentLogger: Logger,
  opts: IQueueInstallOpts
) {
  const logger = parentLogger.child({ name: "queue-install" });

  const installLocation =
    opts.installLocation || defaultInstallLocation(ctx.store);

  const { caveId, game, reason } = opts;

  logger.info(`Doing ${reason} for game ${game.title} (#${game.id})`);

  let freshInstall = false;
  let caveIn: Partial<ICave> & ICaveLocation;

  if (caveId) {
    caveIn = ctx.db.caves.findOneById(caveId);
    if (!caveIn) {
      throw new Error(`Couldn't find cave to ${reason}`);
    }
  } else {
    if (reason === "reinstall") {
      throw new Error(`Asked to ${reason}, but no cave found`);
    }

    freshInstall = true;

    let installFolder = installFolderName(game);

    const { handPicked, upload } = opts;

    caveIn = {
      id: uuid(),
      gameId: game.id,
      upload: toJSONField(upload),
      installLocation,
      installFolder,
      pathScheme: paths.PathScheme.MODERN_SHARED,
      handPicked,
    };

    if (reason === "install") {
      await ensureUniqueInstallLocation(ctx, caveIn);
    }
  }

  try {
    const { upload } = opts;

    const versionName = (buildId: number, buildUserVersion: string) => {
      if (buildUserVersion) {
        return `${buildUserVersion} (#${buildId})`;
      } else if (buildId) {
        return `#{buildId}`;
      } else {
        return "<not versioned>";
      }
    };

    if (!freshInstall) {
      logger.info(
        `← old version: ${versionName(caveIn.buildId, caveIn.buildUserVersion)}`
      );
    }
    logger.info(
      `→ new version: ${versionName(
        upload.buildId,
        upload.build && upload.build.userVersion
      )}`
    );

    const prefs = ctx.store.getState().preferences;
    let destPath = paths.appPath(caveIn, prefs);
    let archivePath = paths.downloadPath(upload, prefs);

    if (!await sf.exists(archivePath)) {
      const { handPicked } = opts;

      // FIXME: so, this is almost definitely not what we want
      // why is the reason hardcoded to 'install' ?
      // what about reinstalls, heals, uninstalls?
      // FIXME: (bis) we don't need the archive to uninstall everything
      // we want to keep the download folder clean
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
        })
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
      ctx,
      runtime,
      logger,
      game,
      reason,

      destPath,
      archivePath,
      upload,
      caveIn: caveIn as ICave, // FIXME: poor style
    });
  } catch (e) {
    if (isCancelled(e)) {
      logger.error(`Cancelled ${reason} for ${game.title}: ${e.message}`);
      ctx.store.dispatch(
        actions.statusMessage({ message: ["status.cancelled.message"] })
      );
    }
    throw e;
  }
}

const slugRegexp = /^\/([^\/]+)/;

/** Gives a human-readable install folder name, given a game */
export function installFolderName(game: IGame) {
  if (!game) {
    throw new Error(`No game provided to installFolderName`);
  }

  return installFolderNameFromSlug(game) || installFolderNameFromId(game);
}

function installFolderNameFromSlug(game: IGame) {
  if (typeof game.url !== "string") {
    return null;
  }

  let parsed: url.Url;
  try {
    // url.parse may throw, in rare occasions
    // https://nodejs.org/docs/latest/api/url.html
    parsed = url.parse(game.url);
  } catch (e) {
    return null;
  }

  const matches = slugRegexp.exec(parsed.pathname);
  if (!matches) {
    return null;
  }

  const slug = matches[1];
  if (!slug) {
    return null;
  }

  return slug;
}

function installFolderNameFromId(game: IGame) {
  return `game-${game.id}`;
}

/** Modifies.installFolder until it no longer exists on disk */
async function ensureUniqueInstallLocation(ctx: Context, cave: ICaveLocation) {
  let { installFolder } = cave;

  const { preferences } = ctx.store.getState();
  const installFolderExists = async function() {
    const fullPath = paths.appPath(cave, preferences);
    return await sf.exists(fullPath);
  };

  let seed = 2;
  // if you need more than 1200 games with the exact same name... you don't.
  while ((await installFolderExists()) && seed < 1200) {
    cave.installFolder = `${installFolder}-${seed++}`;
  }
}

import { DB } from "../db";
import { Watcher } from "./watcher";
import { promisedModal } from "./modals";

export default async function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueInstall, async (store, action) => {
    const { game } = action.payload;

    await asTask({
      name: "install",
      gameId: game.id,
      db,
      store,
      work: (ctx, logger) => queueInstall(ctx, logger, action.payload),
      onError: async (err, log) => {
        await promisedModal(store, {
          title: ["prompt.install_error.title"],
          message: ["prompt.install_error.message"],
          widget: "show-error",
          widgetParams: {
            errorStack: err.stack,
            log,
          },
          buttons: [
            {
              label: ["prompt.action.ok"],
              action: actions.modalResponse({}),
            },
            "cancel",
          ],
        });
      },
    });
  });
}
