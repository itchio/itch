import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd";
import { Cave, CheckUpdateResult } from "common/butlerd/messages";
import { Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { isEmpty } from "underscore";

const logger = mainLogger.child(__filename);

const SKIP_GAME_UPDATES = process.env.ITCH_SKIP_GAME_UPDATES === "1";

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 20 * 60 * 1000;
const DELAY_BETWEEN_PASSES_WIGGLE = 10 * 60 * 1000;

function sleepTime(): number {
  return DELAY_BETWEEN_PASSES + Math.random() * DELAY_BETWEEN_PASSES_WIGGLE;
}

function reschedule(store: Store) {
  const nextCheck = Date.now() + sleepTime();
  logger.info(`Scheduling next game update check for ${new Date(nextCheck)}`);

  store.dispatch(
    actions.scheduleSystemTask({
      nextGameUpdateCheck: nextCheck,
    })
  );
}

export default function (watcher: Watcher) {
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

    if (!store.getState().setup.done) {
      return;
    }

    store.dispatch(
      actions.gameUpdateCheckStatus({
        checking: true,
        progress: 0,
      })
    );

    try {
      store.dispatch(
        actions.gameUpdateCheckStatus({
          checking: true,
          progress: 0,
        })
      );

      const res = await mcall(messages.CheckUpdate, {}, (convo) => {
        hookLogging(convo, logger);

        convo.onNotification(
          messages.GameUpdateAvailable,
          async ({ update }) => {
            store.dispatch(actions.gameUpdateAvailable({ update }));
          }
        );

        convo.onNotification(messages.Progress, async ({ progress }) => {
          store.dispatch(
            actions.gameUpdateCheckStatus({
              checking: true,
              progress,
            })
          );
        });
      });

      if (!isEmpty(res.updates)) {
        for (const update of res.updates) {
          store.dispatch(actions.gameUpdateAvailable({ update }));
        }
      }

      if (!isEmpty(res.warnings)) {
        logger.warn(`Got warnings when checking for updates: `);
        for (const w of res.warnings) {
          logger.warn(w);
        }
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
    const { caveId } = action.payload;
    logger.info(`Looking for updates for cave ${caveId}`);
    const { cave } = await mcall(messages.FetchCave, { caveId });

    let res: CheckUpdateResult;
    try {
      // cf. https://github.com/itchio/itch/issues/2128
      await mcall(messages.CavesSetPinned, {
        caveId,
        pinned: false,
      });
      res = await mcall(messages.CheckUpdate, {
        caveIds: [caveId],
        verbose: true,
      });
    } catch (e) {
      logger.error(`While checking for game update: ${e.stack}`);
      if (!res) {
        res = {
          updates: [],
          warnings: [String(e)],
        };
      }
    }

    if (res && !isEmpty(res.updates)) {
      for (const update of res.updates) {
        store.dispatch(actions.gameUpdateAvailable({ update }));
      }
    }

    dispatchUpdateNotification(store, cave, res);
  });

  watcher.on(actions.snoozeCave, async (store, action) => {
    const { caveId } = action.payload;

    await mcall(messages.SnoozeCave, { caveId });
  });
}

function dispatchUpdateNotification(
  store: Store,
  cave: Cave,
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
        message: ["status.game_update.not_found", { title: cave.game.title }],
      })
    );
  } else {
    store.dispatch(
      actions.statusMessage({
        message: ["status.game_update.found", { title: cave.game.title }],
      })
    );
  }
}
