import { Watcher } from "../watcher";
import { actions } from "../../actions";
import { messages, withButlerClient } from "../../buse";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-operations" });

export default function(watcher: Watcher) {
  watcher.on(actions.prioritizeDownload, async (store, action) => {
    const { id } = action.payload;
    await withButlerClient(logger, async client => {
      await client.call(messages.DownloadsPrioritize({ downloadId: id }));
    });
  });

  watcher.on(actions.discardDownload, async (store, action) => {
    const { id } = action.payload;
    await withButlerClient(logger, async client => {
      await client.call(messages.DownloadsDiscard({ downloadId: id }));
    });
  });

  watcher.on(actions.retryDownload, async (store, action) => {
    const { id } = action.payload;
    await withButlerClient(logger, async client => {
      await client.call(messages.DownloadsRetry({ downloadId: id }));
    });
  });

  watcher.on(actions.clearFinishedDownloads, async (store, action) => {
    await withButlerClient(logger, async client => {
      await client.call(messages.DownloadsClearFinished({}));
    });
  });

  // TODO: have butler clear game downloads when an uninstall is performed
  // and clear cave downloads when a download from the same cave is performed
}
