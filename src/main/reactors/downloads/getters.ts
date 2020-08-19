import { DownloadsState } from "common/types";

import { first, filter, sortBy } from "underscore";
import { memoize } from "common/util/lru-memoize";
import { Download } from "common/butlerd/messages";

export const getActiveDownload = memoize(1, function (
  downloads: DownloadsState
): Download {
  return first(getPendingDownloads(downloads));
});

export const getPendingDownloads = memoize(1, function (
  downloads: DownloadsState
): Download[] {
  const pending = filter(downloads.items, (i) => !i.finishedAt);
  return sortBy(pending, "position");
});

export const getFinishedDownloads = memoize(1, function (
  downloads: DownloadsState
): Download[] {
  const pending = filter(downloads.items, (i) => !!i.finishedAt);
  return sortBy(pending, "finishedAt").reverse();
});

export function getPendingForGame(
  downloads: DownloadsState,
  gameId: number
): Download[] {
  return filter(
    getPendingDownloads(downloads),
    (i) => i.game && +i.game.id === +gameId
  );
}
