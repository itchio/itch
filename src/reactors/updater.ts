import { Watcher } from "./watcher";
import { DB } from "../db";
import Context from "../context";

import delay from "./delay";

import { actions } from "../actions";

import lazyGetGame from "./lazy-get-game";
import getGameCredentials from "./downloads/get-game-credentials";
import * as paths from "../os/paths";

import { makeLogger } from "../logger";
const logger = makeLogger({ logPath: paths.updaterLogPath() }).child({
  name: "updater",
});

import { isEmpty } from "underscore";

const SKIP_GAME_UPDATES = process.env.ITCH_SKIP_GAME_UPDATES === "1";

const DELAY_BETWEEN_GAMES = 25;

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 20 * 60 * 1000;
const DELAY_BETWEEN_PASSES_WIGGLE = 10 * 60 * 1000;

import { ICave } from "../db/models/cave";
import { toDateTimeField } from "../db/datetime-field";

import { Game } from "ts-itchio-api";
import { makeButlerInstance, buseGameCredentials } from "../util/buse-utils";
import { messages } from "node-buse";
import { IStore } from "../types/index";

interface IUpdateCheckResult {
  /** set if an error occured while looking for a new version of a game */
  err?: Error;

  /** might be null if an error happened */
  game?: Game;

  /** true if the game has an upgrade that can be installed */
  hasUpgrade?: boolean;
}

async function performGameUpdateCheck(
  ctx: Context,
  cave: ICave
): Promise<IUpdateCheckResult> {
  const returnVars: IUpdateCheckResult = {
    game: null,
    err: null,
    hasUpgrade: false,
  };

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

  if (!game) {
    logger.warn(
      `Can't check for updates for ${game.title}, not visible by current user?`
    );
    return returnVars;
  }
  returnVars.game = game;

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

  const gameCredentials = getGameCredentials(ctx, game);

  const instance = await makeButlerInstance();
  instance.onClient(async client => {
    try {
      const res = await client.call(
        messages.CheckUpdate({
          items: [
            {
              itemId: cave.id,
              installedAt: toDateTimeField(cave.installedAt),
              game,
              upload: cave.upload,
              build: cave.build,
              credentials: buseGameCredentials(gameCredentials),
            },
          ],
        })
      );
      if (!isEmpty(res.updates)) {
        const update = res.updates[0];
        store.dispatch(
          actions.gameUpdateAvailable({
            caveId: update.itemId,
            update,
          })
        );
        returnVars.hasUpgrade = true;
      }
    } catch (e) {
      logger.error(`Update check failed: ${e.stack}`);
      returnVars.err = e;
    } finally {
      instance.cancel();
    }
  });
  await instance.promise();

  return returnVars;
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

    if (SKIP_GAME_UPDATES) {
      logger.debug(
        "Skipping game update check as requested per environment variable"
      );
    } else {
      logger.info("Regularly scheduled check for game updates...");
      store.dispatch(actions.checkForGameUpdates({}));
    }
  });

  watcher.on(actions.checkForGameUpdates, async (store, action) => {
    // FIXME: that's a bit dirty
    // TODO: also, paginate
    const caves = db.caves.all(k => k.where("1"));

    const ctx = new Context(store, db);

    for (const cave of caves) {
      try {
        await performGameUpdateCheck(ctx, cave);
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
      const result = await performGameUpdateCheck(ctx, cave);
      if (noisy) {
        dispatchUpdateNotification(store, result);
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

function dispatchUpdateNotification(store: IStore, result: IUpdateCheckResult) {
  if (!result) {
    return;
  }

  if (result.err) {
    store.dispatch(
      actions.statusMessage({
        message: ["status.game_update.check_failed", { err: result.err }],
      })
    );
    return;
  }

  if (result.hasUpgrade) {
    store.dispatch(
      actions.statusMessage({
        message: ["status.game_update.found", { title: result.game.title }],
      })
    );
    return;
  }

  store.dispatch(
    actions.statusMessage({
      message: ["status.game_update.not_found", { title: result.game.title }],
    })
  );
}
