import { IDownloadsState, IDownloadItem } from "../../types";

import { first, filter, sortBy } from "underscore";

export function getActiveDownload(downloads: IDownloadsState): IDownloadItem {
  return first(getPendingDownloads(downloads));
}

export function getPendingDownloads(
  downloads: IDownloadsState,
): IDownloadItem[] {
  const pending = filter(downloads.items, i => !i.finished);
  return sortBy(pending, "order");
}

export function getFinishedDownloads(
  downloads: IDownloadsState,
): IDownloadItem[] {
  const pending = filter(downloads.items, i => i.finished);
  return sortBy(pending, "finishedAt").reverse();
}

export function getPendingForGame(
  downloads: IDownloadsState,
  gameId: number,
): IDownloadItem[] {
  return filter(
    getPendingDownloads(downloads),
    i => i.game && +i.game.id === +gameId,
  );
}

export function excludeGame(
  downloads: IDownloadsState,
  gameId: number,
): IDownloadItem[] {
  return filter(downloads.items, i => !i.game || +i.game.id !== +gameId);
}
