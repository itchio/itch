import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd";
import { Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { Phase, state } from "./driver-persistent-state";

const logger = mainLogger.child(__filename);

export default function(watcher: Watcher) {
  // we don't have to worry about login because we start out with paused downloads
  // and it unpauses them on login.

  watcher.on(actions.setDownloadsPaused, async (store, action) => {
    await driverPoll(store);
  });

  watcher.on(actions.refreshDownloads, async (store, action) => {
    await refreshDownloads(store);
  });

  watcher.on(actions.gotButlerdEndpoint, async (store, action) => {
    state.setPhase(Phase.IDLE);
    await driverPoll(store);
    await refreshDownloads(store);
  });
}

async function refreshDownloads(store: Store) {
  const { downloads } = await mcall(messages.DownloadsList, {});
  store.dispatch(actions.downloadsListed({ downloads }));
}

async function driverPoll(store: Store) {
  logger.info(`Download driver polling...`);

  const rs = store.getState();
  if (!rs.setup.done) {
    return;
  }

  const { paused } = rs.downloads;
  if (paused) {
    logger.info(`Paused... current phase: ${Phase[state.getPhase()]}`);
    switch (state.getPhase()) {
      case Phase.RUNNING: {
        await state.cancel();
        break;
      }
    }
  } else {
    logger.info(`Not paused... current phase: ${Phase[state.getPhase()]}`);
    switch (state.getPhase()) {
      case Phase.IDLE: {
        state.setPhase(Phase.STARTING);

        try {
          await mcall(messages.DownloadsDrive, {}, convo => {
            state.setPhase(Phase.RUNNING);

            hookLogging(convo, logger);

            convo.on(messages.DownloadsDriveStarted, async ({ download }) => {
              await refreshDownloads(store);
            });

            convo.on(messages.DownloadsDriveDiscarded, async ({ download }) => {
              await refreshDownloads(store);
            });

            convo.on(messages.DownloadsDriveErrored, async ({ download }) => {
              await refreshDownloads(store);
            });

            convo.on(messages.DownloadsDriveFinished, async ({ download }) => {
              await refreshDownloads(store);
              store.dispatch(actions.downloadEnded({ download }));
            });

            convo.on(
              messages.DownloadsDriveProgress,
              async ({ download, progress, speedHistory }) => {
                store.dispatch(
                  actions.downloadProgress({
                    download,
                    progress,
                    speedHistory,
                  })
                );
              }
            );
          });
        } catch (e) {
          logger.error(`${e.stack}`);
        } finally {
          state.setPhase(Phase.IDLE);
        }

        break;
      }
    }
  }
}
