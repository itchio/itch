import { Watcher } from "./watcher";
import { DB } from "../db";
import Context from "../context";

import { actions } from "../actions";

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

import {
  messages,
  makeButlerInstance,
  setupLogging,
  withButlerClient,
} from "../buse/index";
import { IStore } from "../types/index";
import { CheckUpdateItem, CheckUpdateResult, Cave } from "../buse/messages";

async function prepareUpdateItem(
  ctx: Context,
  cave: Cave
): Promise<CheckUpdateItem> {
  if (!cave.game) {
    throw new Error(`Cave ${cave.id} lacks game`);
  }

  const item: CheckUpdateItem = {
    itemId: cave.id,
    installedAt: cave.stats.installedAt,
    game: cave.game,
    upload: cave.upload,
    build: cave.build,
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
    setupLogging(client, logger);
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

        // TODO: let butler page through the caves instead,
        // this is too much back and forth
        const { caves } = await withButlerClient(
          logger,
          async client => await client.call(messages.FetchCaves({}))
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

    const { cave } = await withButlerClient(
      logger,
      async client => await client.call(messages.FetchCave({ caveId }))
    );

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
