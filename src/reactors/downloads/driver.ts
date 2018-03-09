import { Watcher } from "../watcher";
import { actions } from "../../actions";
import {
  makeButlerInstance,
  messages,
  setupClient,
  withButlerClient,
} from "../../buse";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-driver" });

import state from "./driver-persistent-state";
import { MinimalContext } from "../../context";

export default function(watcher: Watcher) {
  watcher.on(actions.tick, async (store, action) => {
    const { paused } = store.getState().downloads;
    if (paused) {
      if (state.instance && !state.instance.cancelled) {
        // TODO: graceful cancel first
        logger.info("Cancelling download driver!");
        state.instance.cancel();
      }
    } else {
      if (!state.instance) {
        logger.info("Starting download driver!");
        state.instance = await makeButlerInstance();
        state.instance.onClient(async client => {
          setupClient(client, logger, new MinimalContext());

          client.onNotification(
            messages.DownloadsDriveFinished,
            async ({ params }) => {
              const { download } = params;
              store.dispatch(actions.downloadEnded({ download }));
            }
          );
          client.onNotification(
            messages.DownloadsDriveProgress,
            async ({ params }) => {
              const { download, progress } = params;
              store.dispatch(actions.downloadProgress({ download, progress }));
            }
          );
          state.client = client;
          await client.call(messages.DownloadsDrive({}));
        });
        state.instance
          .promise()
          .catch(e => {})
          .then(() => {
            state.instance = null;
            state.client = null;
          });
      }
    }

    await withButlerClient(logger, async client => {
      const { downloads } = await client.call(messages.DownloadsList({}));
      store.dispatch(actions.downloadsListed({ downloads }));
    });
  });
}
