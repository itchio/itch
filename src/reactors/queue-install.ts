import uuid from "../util/uuid";

import Context from "../context";

import * as actions from "../actions";
import * as url from "url";

import { ICave, ICaveLocation } from "../db/models/cave";
import { IGame } from "../db/models/game";
import { toJSONField, fromJSONField } from "../db/json-field";
import {
  IQueueInstallOpts,
  IStore,
  isCancelled,
  InstallReason,
  ILocalizedString,
} from "../types";

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

  const { handPicked, upload } = opts;
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
    // const { upload } = opts;
    // if (!freshInstall) {
    //   logger.info(
    //     `← old version: ${formatBuildVersion(fromJSONField(caveIn.build))}`
    //   );
    // }
    // logger.info(`→ new version: ${formatBuildVersion(upload.build)}`);

    const prefs = ctx.store.getState().preferences;
    let destPath = paths.appPath(caveIn, prefs);
    // let archivePath = paths.downloadPath(upload, prefs);
    let archivePath = null;
    let taskId = uuid();
    let downloadFolderPath = paths.downloadFolderPathForId(taskId, prefs);

    // TODO: check available disk space
    // have a check at download too, why not.

    // TODO: also, if we do run into `ENOSPC`,
    // show a dialog or something. And offer some help
    // will ya, there's people with tiny tiny SSDs!

    const runtime = currentRuntime();

    const caveOut = await coreInstall({
      ctx,
      runtime,
      logger,
      game,
      reason,

      destPath,
      archivePath,
      downloadFolderPath,
      upload,
      caveIn: caveIn as ICave, // FIXME: poor style
    });

    showReadyNotification(ctx.store, game, reason, caveOut);
  } catch (e) {
    if (isCancelled(e)) {
      logger.error(`Cancelled ${reason} for ${game.title}: ${e.message}`);
      ctx.store.dispatch(
        actions.statusMessage({ message: ["status.cancelled.message"] })
      );
    }
    throw e;
  } finally {
    // await wipeDownloadFolder({
    //   logger,
    //   preferences: ctx.store.getState().preferences,
    //   upload,
    // });
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
import { t } from "../format/index";
import { formatBuildVersion } from "../helpers/build";

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

function showReadyNotification(
  store: IStore,
  game: IGame,
  reason: InstallReason,
  cave: ICave
) {
  const rs = store.getState();

  const { readyNotification = true } = rs.preferences;
  if (!readyNotification) {
    return;
  }

  let message: ILocalizedString;
  const { title } = game;

  if (reason === "install" || reason === "reinstall") {
    message = ["notification.download_installed", { title }];
  } else if (reason === "update") {
    message = ["notification.download_updated", { title }];
  } else if (reason === "revert") {
    const version = formatBuildVersion(fromJSONField(cave.build));
    message = ["notification.download_reverted", { title, version }];
  } else if (reason === "heal") {
    message = ["notification.download_healed", { title }];
  }

  if (message) {
    const { i18n } = rs;
    const body = t(i18n, message);
    store.dispatch(
      actions.notify({
        body,
        onClick: actions.navigate({ tab: "downloads" }),
      })
    );
  }
}
