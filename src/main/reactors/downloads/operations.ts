import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";

export default function (watcher: Watcher) {
  watcher.on(actions.downloadQueued, async (store, action) => {
    store.dispatch(actions.refreshDownloads({}));
  });

  watcher.on(actions.prioritizeDownload, async (store, action) => {
    const { id } = action.payload;
    await mcall(messages.DownloadsPrioritize, { downloadId: id });
    store.dispatch(actions.refreshDownloads({}));
  });

  watcher.on(actions.discardDownload, async (store, action) => {
    const { id } = action.payload;
    await mcall(messages.DownloadsDiscard, { downloadId: id });
    store.dispatch(actions.refreshDownloads({}));
  });

  watcher.on(actions.retryDownload, async (store, action) => {
    const { id } = action.payload;
    await mcall(messages.DownloadsRetry, { downloadId: id });
    store.dispatch(actions.refreshDownloads({}));
  });

  watcher.on(actions.clearFinishedDownloads, async (store, action) => {
    await mcall(messages.DownloadsClearFinished, {});
    store.dispatch(actions.refreshDownloads({}));
  });
}
