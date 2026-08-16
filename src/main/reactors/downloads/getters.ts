import { DownloadsState } from "common/types";

import { memoize } from "common/util/lru-memoize";
import { Download } from "common/butlerd/messages";

export const getActiveDownload = memoize(
  1,
  function (downloads: DownloadsState): Download | undefined {
    return getPendingDownloads(downloads)[0];
  }
);

export const getPendingDownloads = memoize(
  1,
  function (downloads: DownloadsState): Download[] {
    const pending = Object.values(downloads.items).filter((i) => !i.finishedAt);
    return pending.sort((a, b) => a.position - b.position);
  }
);

export const getFinishedDownloads = memoize(
  1,
  function (downloads: DownloadsState): Download[] {
    const finished = Object.values(downloads.items).filter(
      (i) => !!i.finishedAt
    );
    // most recently finished first
    return finished.sort((a, b) => {
      const fa = a.finishedAt ?? "";
      const fb = b.finishedAt ?? "";
      return fa < fb ? 1 : fa > fb ? -1 : 0;
    });
  }
);

export function getPendingForGame(
  downloads: DownloadsState,
  gameId: number
): Download[] {
  return getPendingDownloads(downloads).filter(
    (i) => i.game && +i.game.id === +gameId
  );
}
