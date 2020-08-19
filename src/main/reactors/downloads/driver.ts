import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd";
import { Store, isCancelled } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { Phase, state } from "main/reactors/downloads/driver-persistent-state";
import { Conversation } from "butlerd";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  // we don't have to worry about login because we start out with paused downloads
  // and it unpauses them on login.

  watcher.on(actions.setDownloadsPaused, async (store, action) => {
    await driverPoll(store);
  });

  watcher.on(actions.refreshDownloads, async (store, action) => {
    await refreshDownloads(store);
  });

  watcher.on(actions.gotButlerdEndpoint, async (store, action) => {
    logger.debug(
      `Downloads driver reacting to gotButlerdEndpoint, cancelling state...`
    );
    await state.cancel();
    logger.debug(
      `Downloads driver reacting to gotButlerdEndpoint, state is cancelled...`
    );
    await driverPoll(store);
    await refreshDownloads(store);
  });
}

async function refreshDownloads(store: Store) {
  const { downloads } = await mcall(messages.DownloadsList, {});
  store.dispatch(actions.downloadsListed({ downloads }));
}

async function driverPoll(store: Store) {
  logger.debug(`Download driver polling...`);

  const rs = store.getState();
  if (!rs.setup.done) {
    return;
  }

  const { paused } = rs.downloads;
  if (paused) {
    logger.debug(`Paused... current phase: ${Phase[state.getPhase()]}`);
    switch (state.getPhase()) {
      case Phase.RUNNING: {
        await state.cancel();
        break;
      }
    }
  } else {
    logger.debug(`Not paused... current phase: ${Phase[state.getPhase()]}`);
    switch (state.getPhase()) {
      case Phase.IDLE: {
        state.setPhase(Phase.STARTING);
        let driveConvo: Conversation;
        try {
          await mcall(messages.DownloadsDrive, {}, (convo) => {
            hookLogging(convo, logger);
            state.registerConvo(convo);
            driveConvo = convo;

            convo.onNotification(
              messages.DownloadsDriveStarted,
              async ({ download }) => {
                await refreshDownloads(store);
              }
            );

            convo.onNotification(
              messages.DownloadsDriveDiscarded,
              async ({ download }) => {
                await refreshDownloads(store);
              }
            );

            convo.onNotification(
              messages.DownloadsDriveErrored,
              async ({ download }) => {
                await refreshDownloads(store);
              }
            );

            convo.onNotification(
              messages.DownloadsDriveFinished,
              async ({ download }) => {
                await refreshDownloads(store);
                store.dispatch(actions.downloadEnded({ download }));
              }
            );

            convo.onNotification(
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
          if (isCancelled(e)) {
            // ignore
          } else {
            logger.error(`${e.stack}`);
          }
        } finally {
          if (state.isConvoCurrent(driveConvo)) {
            state.setPhase(Phase.IDLE);
            logger.debug(`Going back to idle after Downloads.Drive call`);
          } else {
            logger.debug(
              `A Downloads.Drive call finished, but another is already up.`
            );
          }
        }

        break;
      }
    }
  }
}
