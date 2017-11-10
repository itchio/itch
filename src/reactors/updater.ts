import { Watcher } from "./watcher";
import { DB } from "../db";
import Context from "../context";

import { isNetworkError } from "../net/errors";

import delay from "./delay";

import * as actions from "../actions";

import lazyGetGame from "./lazy-get-game";
import getGameCredentials from "./downloads/get-game-credentials";
import * as paths from "../os/paths";

import { makeLogger } from "../logger";
const logger = makeLogger({ logPath: paths.updaterLogPath() }).child({
  name: "updater",
});

import { findWhere, filter } from "underscore";

const DELAY_BETWEEN_GAMES = 25;

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 20 * 60 * 1000;
const DELAY_BETWEEN_PASSES_WIGGLE = 10 * 60 * 1000;

import findUploads from "./downloads/find-uploads";
import findUpgradePath from "./downloads/find-upgrade-path";

import { ICave } from "../db/models/cave";
import { fromDateTimeField } from "../db/datetime-field";
import { fromJSONField } from "../db/json-field";

import { fileSize } from "../format/filesize";
import { Game } from "ts-itchio-api";

interface IUpdateCheckResult {
  /** set if an error occured while looking for a new version of a game */
  err?: Error;

  /** might be null if an error happened */
  game?: Game;

  /** true if the game has an upgrade that can be installed */
  hasUpgrade?: boolean;
}

interface IUpdateCheckOpts {
  noisy?: boolean;
}

async function _doCheckForGameUpdate(
  ctx: Context,
  cave: ICave,
  inTaskOpts = {} as IUpdateCheckOpts
): Promise<IUpdateCheckResult> {
  const { noisy = false } = inTaskOpts;
  const returnVars = {} as IUpdateCheckResult;

  const store = ctx.store;
  const state = store.getState();

  if (!cave.gameId) {
    logger.warn(`Cave lacks gameId, skipping: ${cave.id}`);
    return { hasUpgrade: false };
  }

  let game: Game;
  try {
    game = await lazyGetGame(ctx, cave.gameId);
  } catch (e) {
    logger.error(
      `Could not fetch game for ${cave.gameId}, skipping (${e.message || e})`
    );
    return { err: e };
  }
  returnVars.game = game;
  returnVars.hasUpgrade = false;

  if (!game) {
    logger.warn(
      `Can't check for updates for ${game.title}, not visible by current user?`
    );
    return returnVars;
  }

  const tasksForGame = state.tasks.tasksByGameId[game.id];
  if (tasksForGame) {
    for (const task of tasksForGame) {
      if (task.name === "launch") {
        // TODO: don't need to skip the check, just the apply
        logger.warn(`Game ${game.title} is running, skipping update check`);
        return returnVars;
      }
    }
  }

  const caveBuild = fromJSONField(cave.build);

  logger.info(`Looking for updates to ${game.title}...`);

  try {
    const gameCredentials = await getGameCredentials(ctx, game);
    if (!gameCredentials) {
      throw new Error("no game credentials");
    }

    const { uploads } = await findUploads(ctx, { game, gameCredentials });

    if (uploads.length === 0) {
      logger.error(`Can't check for updates for ${game.title}, no uploads.`);
      return { err: new Error("No uploads found") };
    }

    const installedAt = fromDateTimeField(cave.installedAt) || new Date(0);
    logger.info(`installed at ${installedAt.toISOString()}`);

    const recentUploads = filter(uploads, upload => {
      const updatedAt = fromDateTimeField(upload.updatedAt);
      logger.info(`upload ${upload.id} updated at ${updatedAt.toISOString()}`);
      const isRecent = updatedAt.getTime() > installedAt.getTime();
      if (!isRecent) {
        logger.info(
          `Filtering out ${upload.filename} (#${upload.id})` +
            `, ${updatedAt.toISOString()} is older than ${installedAt.toISOString()}`
        );
      }
      return isRecent;
    });
    logger.info(
      `${uploads.length} available uploads, ${recentUploads.length} are more recent`
    );

    let hasUpgrade = false;

    const caveUpload = fromJSONField(cave.upload);
    if (caveUpload && caveBuild) {
      logger.info(
        `Looking for new builds of ${game.title}, from build ${caveBuild.id} (upload ${caveUpload.id})`
      );
      const upload = findWhere(uploads, { id: caveUpload.id });
      if (!upload || !upload.buildId) {
        logger.warn("Uh oh, our wharf-enabled upload disappeared");
      } else {
        if (upload.buildId !== caveBuild.id) {
          logger.info(
            `Got new build available: ${upload.buildId} > ${caveBuild.id}`
          );
          if (noisy) {
            store.dispatch(
              actions.statusMessage({
                message: ["status.game_update.found", { title: game.title }],
              })
            );
          }

          hasUpgrade = true;

          try {
            const upgradePathResult = await findUpgradePath(ctx, {
              currentBuildId: caveBuild.id,
              game,
              gameCredentials,
              upload,
            });
            if (!upgradePathResult) {
              throw new Error("no upgrade path found");
            }
            const { upgradePath, totalSize } = upgradePathResult;

            logger.info(
              `Got ${upgradePath.length} patches to download, ${fileSize(
                totalSize
              )} total`
            );

            store.dispatch(
              actions.gameUpdateAvailable({
                caveId: cave.id,
                update: {
                  game,
                  gameCredentials,
                  recentUploads: [upload],
                  incremental: true,
                  upgradePath,
                },
              })
            );

            return { ...returnVars, hasUpgrade };
          } catch (e) {
            logger.error(`While getting upgrade path: ${e.message || e}`);
            return { err: e.message };
          }
        } else {
          logger.info(
            `Newest upload has same buildId ${upload.buildId}, disregarding`
          );
          return returnVars;
        }
      }
    }

    if (recentUploads.length === 0) {
      logger.info(`No recent uploads for ${game.title}, update check done`);
      return returnVars;
    }

    if (recentUploads.length > 1) {
      logger.info("Multiple recent uploads, user will have to pick");

      store.dispatch(
        actions.gameUpdateAvailable({
          caveId: cave.id,
          update: {
            game,
            gameCredentials,
            recentUploads,
          },
        })
      );

      return { ...returnVars, hasUpgrade: true };
    }

    const upload = recentUploads[0];
    const differentUpload = upload.id !== caveUpload.id;
    const wentWharf = upload.buildId && !caveBuild;

    if (hasUpgrade || differentUpload || wentWharf) {
      logger.info(`Got a new upload for ${game.title}: ${upload.filename}`);
      if (hasUpgrade) {
        logger.info("(Reason: forced)");
      }
      if (differentUpload) {
        logger.info("(Reason: different upload)");
      }
      if (wentWharf) {
        logger.info("(Reason: went wharf)");
      }

      store.dispatch(
        actions.gameUpdateAvailable({
          caveId: cave.id,
          update: {
            game,
            gameCredentials,
            recentUploads,
          },
        })
      );

      return { ...returnVars, hasUpgrade };
    }
  } catch (e) {
    if (isNetworkError(e)) {
      logger.warn(`Skipping update check for ${game.title}: we're offline`);
      return { err: new Error(`Network error (${e.code})`) };
    } else {
      logger.error(`While looking for update: ${e.stack || e}`);
      logger.error(`Error object: ${JSON.stringify(e, null, 2)}`);
      return { err: e };
    }
  }

  return returnVars;
}

async function doCheckForGameUpdate(
  ctx: Context,
  cave: ICave,
  taskOpts = {} as IUpdateCheckOpts
) {
  try {
    return await _doCheckForGameUpdate(ctx, cave, taskOpts);
  } catch (e) {
    if (e.code && e.code === "ENOTFOUND") {
      logger.warn("Offline, skipping update check");
    } else {
      throw e;
    }
  }
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.tick, async (store, action) => {
    const { nextGameUpdateCheck } = store.getState().systemTasks;
    if (Date.now() <= nextGameUpdateCheck) {
      // it's not our time... yet!
      return;
    }

    const sleepTime =
      DELAY_BETWEEN_PASSES + Math.random() * DELAY_BETWEEN_PASSES_WIGGLE;
    store.dispatch(
      actions.scheduleSystemTask({
        nextGameUpdateCheck: Date.now() + sleepTime,
      })
    );

    logger.info("Regularly scheduled check for game updates...");
    store.dispatch(actions.checkForGameUpdates({}));
  });

  watcher.on(actions.checkForGameUpdates, async (store, action) => {
    // FIXME: that's a bit dirty
    const caves = db.caves.all(k => k.where("1"));

    const ctx = new Context(store, db);

    for (const cave of caves) {
      try {
        await doCheckForGameUpdate(ctx, cave);
      } catch (e) {
        logger.error(
          `While checking for cave ${cave.id} update: ${e.stack || e}`
        );
      }
      await delay(DELAY_BETWEEN_GAMES);
    }
  });

  watcher.on(actions.checkForGameUpdate, async (store, action) => {
    const { caveId, noisy = false } = action.payload;
    if (noisy) {
      logger.info(`Looking for updates for cave ${caveId}`);
    }

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      logger.warn(`No cave with id ${caveId}, bailing out`);
      return;
    }

    const ctx = new Context(store, db);

    try {
      const result = await doCheckForGameUpdate(ctx, cave, { noisy });
      if (noisy) {
        if (result && result.err) {
          store.dispatch(
            actions.statusMessage({
              message: ["status.game_update.check_failed", { err: result.err }],
            })
          );
        } else if (result && result.hasUpgrade) {
          if (result.game) {
            store.dispatch(
              actions.statusMessage({
                message: [
                  "status.game_update.found",
                  { title: result.game.title },
                ],
              })
            );
          }
        } else if (result && result.game) {
          store.dispatch(
            actions.statusMessage({
              message: [
                "status.game_update.not_found",
                { title: result.game.title },
              ],
            })
          );
        }
      }
    } catch (e) {
      logger.error(`While checking for cave ${caveId} update: ${e.stack || e}`);
      if (noisy) {
        store.dispatch(
          actions.statusMessage({
            message: ["status.game_update.check_failed", { err: e }],
          })
        );
      }
    } finally {
      if (noisy) {
        logger.info(`Done looking for updates for cave ${caveId}`);
      }
    }
  });
}
