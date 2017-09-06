import { IDownloadsState, IDownloadItem } from "../../types";

import { first, filter, sortBy } from "underscore";
import memoize from "../../util/lru-memoize";

export const getActiveDownload = memoize(1, function(
  downloads: IDownloadsState
): IDownloadItem {
  return first(getPendingDownloads(downloads));
});

export const getPendingDownloads = memoize(1, function(
  downloads: IDownloadsState
): IDownloadItem[] {
  const pending = filter(downloads.items, i => !i.finished);
  return sortBy(pending, "order");
});

export const getFinishedDownloads = memoize(1, function(
  downloads: IDownloadsState
): IDownloadItem[] {
  const pending = filter(downloads.items, i => i.finished);
  return sortBy(pending, "finishedAt").reverse();
});

export function getPendingForGame(
  downloads: IDownloadsState,
  gameId: number
): IDownloadItem[] {
  return filter(
    getPendingDownloads(downloads),
    i => i.game && +i.game.id === +gameId
  );
}

export function excludeGame(
  downloads: IDownloadsState,
  gameId: number
): IDownloadItem[] {
  return filter(downloads.items, i => !i.game || +i.game.id !== +gameId);
}
