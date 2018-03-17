import { IDownloadsState } from "../../types";

import { first, filter, sortBy } from "underscore";
import memoize from "../../util/lru-memoize";
import { Download } from "../../buse/messages";

export const getActiveDownload = memoize(1, function(
  downloads: IDownloadsState
): Download {
  return first(getPendingDownloads(downloads));
});

export const getPendingDownloads = memoize(1, function(
  downloads: IDownloadsState
): Download[] {
  const pending = filter(downloads.items, i => !i.finishedAt);
  return sortBy(pending, "position");
});

export const getFinishedDownloads = memoize(1, function(
  downloads: IDownloadsState
): Download[] {
  const pending = filter(downloads.items, i => !!i.finishedAt);
  return sortBy(pending, "finishedAt").reverse();
});

export function getPendingForGame(
  downloads: IDownloadsState,
  gameId: number
): Download[] {
  return filter(
    getPendingDownloads(downloads),
    i => i.game && +i.game.id === +gameId
  );
}
