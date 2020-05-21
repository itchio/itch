import { Download } from "@itchio/valet/messages";
import { DownloadsState } from "common/downloads";
import { filterObject } from "common/filter-object";
import { packets } from "common/packets";
import { queries } from "common/queries";
import _ from "lodash";
import { useState, useCallback } from "react";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";
import { socket } from "renderer";

export interface DownloadFilter {
  gameId?: number;
}

function applyFilter(dl: Download, filter?: DownloadFilter): boolean {
  if (filter?.gameId) {
    return dl.game?.id == filter?.gameId;
  } else {
    return true;
  }
}

export function useDownloads(filter?: DownloadFilter): DownloadsState {
  const filterState = JSON.stringify(filter);

  const [downloads, setDownloads] = useState<DownloadsState>({});
  const mergeDownloads = useCallback(
    (fresh: DownloadsState) => {
      setDownloads((old) => ({
        ...old,
        ...filterObject(fresh, (dl) => applyFilter(dl, filter)),
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterState]
  );

  useAsync(
    async () => {
      const { downloads } = await socket.query(queries.getDownloads);
      mergeDownloads(downloads);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterState]
  );

  let downloadChanged = ({ download }: { download: Download }) => {
    mergeDownloads({ [download.id]: download });
  };
  useListen(socket, packets.downloadStarted, downloadChanged, [filterState]);
  useListen(socket, packets.downloadChanged, downloadChanged, [filterState]);
  useListen(
    socket,
    packets.downloadCleared,
    ({ download }) => {
      setDownloads((old) => _.omit(old, download.id));
    },
    [filterState]
  );

  return downloads;
}
