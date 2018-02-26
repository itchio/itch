import { Watcher } from "./watcher";
import { DB } from "../db";
import Context from "../context";

import { actions } from "../actions";

import { getGameCredentialsForId } from "./downloads/get-game-credentials";
import * as paths from "../os/paths";

import { makeLogger } from "../logger";
const logger = makeLogger({ logPath: paths.updaterLogPath() }).child({
  name: "updater",
});

import { isEmpty } from "underscore";

const SKIP_GAME_UPDATES = process.env.ITCH_SKIP_GAME_UPDATES === "1";

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 20 * 60 * 1000;
const DELAY_BETWEEN_PASSES_WIGGLE = 10 * 60 * 1000;

import { ICave } from "../db/models/cave";
import { toDateTimeField } from "../db/datetime-field";

import {
  messages,
  makeButlerInstance,
  buseGameCredentials,
} from "../buse/index";
import { IStore, IGameCredentials } from "../types/index";
import { CheckUpdateItem, CheckUpdateResult } from "../buse/messages";
import { client } from "../api/index";
import { Game } from "../buse/messages";
import lazyGetGame from "./lazy-get-game";

function queueGameUpdate(
  gameCredentials: IGameCredentials,
  db: DB,
  gameId: number
) {
  (async () => {
    try {
      const api = client.withKey(gameCredentials.apiKey);
      let game: Game;
      try {
        const gameRes = await api.game(gameId);
        if (gameRes) {
          game = gameRes.entities.games[gameRes.result.gameId];
        }
      } catch (e) {}

      if (game) {
        db.saveOne("games", game.id, game);
      }
    } catch (e) {
      logger.warn(`Could not update game info for ${gameId}: ${e.stack}`);
    }
  })();
}

async function prepareUpdateItem(
  ctx: Context,
  cave: ICave
): Promise<CheckUpdateItem> {
  if (!cave.gameId) {
    throw new Error(`Cave ${cave.id} lacks gameId`);
  }

  const gameCredentials = getGameCredentialsForId(ctx, cave.gameId);
  if (!gameCredentials) {
    throw new Error(`Could not find game credentials for game ${cave.gameId}`);
  }
  queueGameUpdate(gameCredentials, ctx.db, cave.gameId);

  const game = await lazyGetGame(ctx, cave.gameId);
  if (!game) {
    throw new Error(`Invalid game ${cave.gameId}`);
  }

  const item: CheckUpdateItem = {
    itemId: cave.id,
    installedAt: toDateTimeField(cave.installedAt),
    game,
    upload: cave.upload,
    build: cave.build,
    credentials: buseGameCredentials(gameCredentials),
  };
  return item;
}

async function performUpdateCheck(
  ctx: Context,
  items: CheckUpdateItem[]
): Promise<CheckUpdateResult> {
  let res: CheckUpdateResult;

  const instance = await makeButlerInstance();
  instance.onClient(async client => {
    try {
      client.onNotification(
        messages.GameUpdateAvailable,
        async ({ params }) => {
          const { update } = params;
          ctx.store.dispatch(actions.gameUpdateAvailable({ update }));
        }
      );
      res = await client.call(messages.CheckUpdate({ items }));
    } finally {
      instance.cancel();
    }
  });
  await instance.promise();
  return res;
}

function sleepTime(): number {
  return DELAY_BETWEEN_PASSES + Math.random() * DELAY_BETWEEN_PASSES_WIGGLE;
}

function reschedule(store: IStore) {
  const nextCheck = Date.now() + sleepTime();
  logger.info(`Scheduling next game update check for ${new Date(nextCheck)}`);

  store.dispatch(
    actions.scheduleSystemTask({
      nextGameUpdateCheck: nextCheck,
    })
  );
}

export default function(watcher: Watcher, db: DB) {
  if (SKIP_GAME_UPDATES) {
    logger.debug(
      "Skipping game update check as requested per environment variable"
    );
  } else {
    watcher.on(actions.tick, async (store, action) => {
      const { nextGameUpdateCheck } = store.getState().systemTasks;
      if (Date.now() <= nextGameUpdateCheck) {
        // it's not our time... yet!
        return;
      }

      logger.info("Regularly scheduled check for game updates...");
      store.dispatch(actions.checkForGameUpdates({}));
    });
  }

  watcher.on(actions.checkForGameUpdates, async (store, action) => {
    reschedule(store);

    store.dispatch(
      actions.gameUpdateCheckStatus({
        checking: true,
        progress: 0,
      })
    );

    try {
      const ctx = new Context(store, db);
      const totalCaves = db.caves.count(k => k.where("1"));
      let limit = 15;
      let offset = 0;

      while (offset < totalCaves) {
        store.dispatch(
          actions.gameUpdateCheckStatus({
            checking: true,
            progress: offset / totalCaves,
          })
        );

        let start = offset;
        let end = offset + limit;
        if (end > totalCaves) {
          end = totalCaves;
        }
        logger.info(
          `Checking updates for games ${start}-${end} of ${totalCaves}`
        );

        const caves = db.caves.all(k =>
          k
            .where("1")
            .limit(limit)
            .offset(offset)
        );
        let items: CheckUpdateItem[] = [];
        for (const cave of caves) {
          try {
            const item = await prepareUpdateItem(ctx, cave);
            items.push(item);
          } catch (e) {
            logger.error(
              `Won't be able to check ${cave.id} for upgrade: ${e.stack}`
            );
          }
        }

        try {
          await performUpdateCheck(ctx, items);
        } catch (e) {
          logger.error(
            `While performing ${items.length} update checks: ${e.stack}`
          );
        }
        offset += limit;
      }
    } finally {
      store.dispatch(
        actions.gameUpdateCheckStatus({
          checking: false,
          progress: -1,
        })
      );
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
    const item = await prepareUpdateItem(ctx, cave);
    let res: CheckUpdateResult;

    try {
      res = await performUpdateCheck(ctx, [item]);
    } catch (e) {
      logger.error(`While checking for game update: ${e.stack}`);
      if (!res) {
        res = {
          updates: [],
          warnings: [String(e)],
        };
      }
    }

    if (noisy) {
      dispatchUpdateNotification(store, item, res);
    }
  });
}

function dispatchUpdateNotification(
  store: IStore,
  item: CheckUpdateItem,
  result: CheckUpdateResult
) {
  if (!result) {
    return;
  }

  if (!isEmpty(result.warnings)) {
    store.dispatch(
      actions.statusMessage({
        message: [
          "status.game_update.check_failed",
          { err: result.warnings[0] },
        ],
      })
    );
    return;
  }

  if (isEmpty(result.updates)) {
    store.dispatch(
      actions.statusMessage({
        message: ["status.game_update.not_found", { title: item.game.title }],
      })
    );
  } else {
    store.dispatch(
      actions.statusMessage({
        message: ["status.game_update.found", { title: item.game.title }],
      })
    );
  }
}
