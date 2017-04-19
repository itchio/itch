
import {Watcher} from "./watcher";

import {EventEmitter} from "events";
import * as humanize from "humanize-plus";

import {getUserMarket, getGlobalMarket} from "./market";
import delay from "./delay";

import * as actions from "../actions";

import fetch from "../util/fetch";
import pathmaker from "../util/pathmaker";
import api from "../util/api";

import mklog from "../util/log";
const log = mklog("updater");
const opts = {
  logger: new mklog.Logger({
    sinks: {
      console: true,
      file: pathmaker.updaterLogPath(),
    },
  }),
};

import {findWhere, filter} from "underscore";

const DELAY_BETWEEN_GAMES = 25;

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 20 * 60 * 1000;
const DELAY_BETWEEN_PASSES_WIGGLE = 10 * 60 * 1000;

import findUpload from "../tasks/find-upload";
import findUpgradePath from "../tasks/find-upgrade-path";

import * as moment from "moment-timezone";

import {
  IStore,
  IGameRecord,
  ICaveRecord,
  IDownloadKey,
} from "../types";

interface IUpdateCheckResult {
  /** set if an error occured while looking for a new version of a game */
  err?: Error;

  /** might be null if an error happened */
  game?: IGameRecord;

  /** true if the game has an upgrade that can be installed */
  hasUpgrade?: boolean;
}

interface IUpdateCheckOpts {
  noisy?: boolean;
}

async function _doCheckForGameUpdate (store: IStore, cave: ICaveRecord, inTaskOpts = {} as IUpdateCheckOpts,
    ): Promise<IUpdateCheckResult> {
  const {noisy = false} = inTaskOpts;
  const returnVars = {} as IUpdateCheckResult;

  const state = store.getState();
  const credentials = state.session.credentials;

  const {installedBy} = cave;
  const {me} = credentials;
  if (installedBy && me) {
    if (installedBy.id !== me.id) {
      log(opts, `${cave.id} was installed by ${installedBy.username}, we're ${me.username}, skipping check`);
      return {hasUpgrade: false};
    }
  }

  if (!cave.launchable) {
    log(opts, `Cave isn't launchable, skipping: ${cave.id}`);
    return {hasUpgrade: false};
  }

  if (!cave.gameId) {
    log(opts, `Cave lacks gameId, skipping: ${cave.id}`);
    return {hasUpgrade: false};
  }

  const market = getUserMarket();
  let game: IGameRecord;
  try {
    game = await fetch.gameLazily(market, credentials, cave.gameId);
  } catch (e) {
    log(opts, `Could not fetch game for ${cave.gameId}, skipping (${e.message || e})`);
    return {err: e};
  }
  returnVars.game = game;
  returnVars.hasUpgrade = false;

  const logger = new mklog.Logger({sinks: {console: false, string: true}});

  if (!game) {
    log(opts, `Can't check for updates for ${game.title}, not visible by current user?`);
    return returnVars;
  }

  const tasksForGame = state.tasks.tasksByGameId[game.id];
  if (tasksForGame) {
    for (const task of tasksForGame) {
      if (task.name === "launch") {
        // TODO: don't need to skip the check, just the apply
        log(opts, `Game ${game.title} is running, skipping update check`);
        return returnVars;
      }
    }
  }

  log(opts, `Looking for updates to ${game.title}...`);

  const out = new EventEmitter();
  const findKey = () => findWhere(market.getEntities<IDownloadKey>("downloadKeys"), {gameId: game.id});
  const taskOpts = {
    ...opts,
    logger,
    game,
    gameId: game.id,
    credentials,
    downloadKey: cave.downloadKey || findKey(),
    market,
  };

  try {
    const {uploads, downloadKey} = await findUpload(out, taskOpts);

    if (uploads.length === 0) {
      log(opts, `Can't check for updates for ${game.title}, no uploads.`);
      logger.contents.trimRight().split("\n").map((line: string) => log(opts, `> ${line}`));
      return {err: new Error("No uploads found")};
    }

    // needed because moment.tz(undefined, "UTC") gives.. the current date!
    // cf. https://github.com/itchio/itch/issues/977
    const installedAtTimestamp = cave.installedAt || 0;

    let installedAt = moment.tz(installedAtTimestamp, "UTC");
    log(opts, `installed at ${installedAt.format()}`);
    if (!installedAt.isValid()) {
      installedAt = moment.tz(0, "UTC");
    }
    const recentUploads = filter(uploads, (upload) => {
      const updatedAt = moment.tz(upload.updatedAt, "UTC");
      const isRecent = updatedAt > installedAt;
      if (!isRecent) {
        log(opts, `Filtering out ${upload.filename} (#${upload.id})` +
          `, ${updatedAt.format()} is older than ${installedAt.format()}`);
      }
      return isRecent;
    });
    log(opts, `${uploads.length} available uploads, ${recentUploads.length} are more recent`);

    let hasUpgrade = false;

    if (cave.uploadId && cave.buildId) {
      log(opts, `Looking for new builds of ${game.title}, from build ${cave.buildId} (upload ${cave.uploadId})`);
      const upload = findWhere(uploads, {id: cave.uploadId});
      if (!upload || !upload.buildId) {
        log(opts, "Uh oh, our wharf-enabled upload disappeared");
      } else {
        if (upload.buildId !== cave.buildId) {
          log(opts, `Got new build available: ${upload.buildId} > ${cave.buildId}`);
          if (noisy) {
            store.dispatch(actions.statusMessage({
              message: ["status.game_update.found", {title: game.title}],
            }));
          }

          hasUpgrade = true;

          const upgradeOpts = {
            ...taskOpts,
            upload,
            gameId: game.id,
            currentBuildId: cave.buildId,
          };
          try {
            const {upgradePath, totalSize} = await findUpgradePath(out, upgradeOpts);
            log(opts, `Got ${upgradePath.length} patches to download, ${humanize.fileSize(totalSize)} total`);

            store.dispatch(actions.gameUpdateAvailable({
              caveId: cave.id,
              update: {
                game,
                recentUploads: [upload],
                downloadKey,
                incremental: true,
                upgradePath,
              },
            }));

            return {...returnVars, hasUpgrade};
          } catch (e) {
            log(opts, `While getting upgrade path: ${e.message || e}`);
            return {err: e.message};
          }
        } else {
          log(opts, `Newest upload has same buildId ${upload.buildId}, disregarding`);
          return returnVars;
        }
      }
    }

    if (recentUploads.length === 0) {
      log(opts, `No recent uploads for ${game.title}, update check done`);
      return returnVars;
    }

    if (recentUploads.length > 1) {
      log(opts, "Multiple recent uploads, asking user to pick");

      store.dispatch(actions.gameUpdateAvailable({
        caveId: cave.id,
        update: {
          game,
          recentUploads,
          downloadKey,
        },
      }));

      return {...returnVars, hasUpgrade: true};
    }

    const upload = recentUploads[0];
    const differentUpload = upload.id !== cave.uploadId;
    const wentWharf = upload.buildId && !cave.buildId;

    if (hasUpgrade || differentUpload || wentWharf) {
      log(opts, `Got a new upload for ${game.title}: ${upload.filename}`);
      if (hasUpgrade) {
        log(opts, "(Reason: forced)");
      }
      if (differentUpload) {
        log(opts, "(Reason: different upload)");
      }
      if (wentWharf) {
        log(opts, "(Reason: went wharf)");
      }

      store.dispatch(actions.gameUpdateAvailable({
        caveId: cave.id,
        update: {
          game,
          recentUploads,
          downloadKey,
        },
      }));

      return {...returnVars, hasUpgrade};
    }
  } catch (e) {
    if (api.hasAPIError(e, "incorrect user for claim")) {
      log(opts, `Skipping update check for ${game.title}, download key belongs to other user`);
    } else if (api.isNetworkError(e)) {
      log(opts, `Skipping update check for ${game.title}: we're offline`);
      return {err: new Error(`Network error (${e.code})`)};
    } else {
      log(opts, `While looking for update: ${e.stack || e}`);
      log(opts, `Error object: ${JSON.stringify(e, null, 2)}`);
      return {err: e};
    }
  }

  return returnVars;
}

async function doCheckForGameUpdate (store: IStore, cave: ICaveRecord, taskOpts = {} as IUpdateCheckOpts) {
  try {
    return await _doCheckForGameUpdate(store, cave, taskOpts);
  } catch (e) {
    if (e.code && e.code === "ENOTFOUND") {
      log(opts, "Offline, skipping update check");
    } else {
      throw e;
    }
  }
}

let updaterInstalled = false;

export default function (watcher: Watcher) {
  watcher.on(actions.sessionReady, async (store, action) => {
    if (updaterInstalled) {
      return;
    }
    updaterInstalled = true;

    while (true) {
      log(opts, "Regularly scheduled check for game updates...");
      store.dispatch(actions.checkForGameUpdates({}));
      await delay(DELAY_BETWEEN_PASSES + Math.random() * DELAY_BETWEEN_PASSES_WIGGLE);
    }
  });

  watcher.on(actions.checkForGameUpdates, async (store, action) => {
    const caves = getGlobalMarket().getEntities<ICaveRecord>("caves");

    for (const caveId of Object.keys(caves)) {
      try {
        await doCheckForGameUpdate(store, caves[caveId]);
      } catch (e) {
        log(opts, `While checking for cave ${caveId} update: ${e.stack || e}`);
      }
      await delay(DELAY_BETWEEN_GAMES);
    }
  });

  watcher.on(actions.checkForGameUpdate, async (store, action) => {
    const {caveId, noisy = false} = action.payload;
    if (noisy) {
      log(opts, `Looking for updates for cave ${caveId}`);
    }

    const cave = getGlobalMarket().getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      log(opts, `No cave with id ${caveId}, bailing out`);
      return;
    }

    try {
      const result = await doCheckForGameUpdate(store, cave, {noisy});
      if (noisy) {
        if (result && result.err) {
          store.dispatch(actions.statusMessage({
            message: ["status.game_update.check_failed", {err: result.err}],
          }));
        } else if (result && result.hasUpgrade) {
          if (result.game) {
            store.dispatch(actions.statusMessage({
              message: ["status.game_update.found", {title: result.game.title}],
            }));
          }
        } else if (result && result.game) {
          store.dispatch(actions.statusMessage({
            message: ["status.game_update.not_found", {title: result.game.title}],
          }));
        }
      }
    } catch (e) {
      log(opts, `While checking for cave ${caveId} update: ${e.stack || e}`);
      if (noisy) {
        store.dispatch(actions.statusMessage({
          message: ["status.game_update.check_failed", {err: e}],
        }));
      }
    } finally {
      if (noisy) {
        log(opts, `Done looking for updates for cave ${caveId}`);
      }
    }
  });
}
