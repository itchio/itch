import { Download } from "common/butlerd/messages";
import { DownloadsState, DownloadWithProgress } from "common/downloads";
import { filterObject } from "common/filter-object";
import { packets } from "common/packets";
import { queries } from "common/queries";
import _ from "lodash";
import { useState } from "react";
import { useSocket } from "renderer/contexts";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";

export type DownloadFilter = (dl: DownloadWithProgress) => boolean;

const noFilter = () => true;

export function useDownloads(
  filter: DownloadFilter = noFilter
): DownloadsState {
  const [downloads, setDownloads] = useState<DownloadsState>({});
  const mergeDownloads = (fresh: DownloadsState) => {
    setDownloads(old => ({
      ...old,
      ...filterObject(fresh, filter),
    }));
  };

  const socket = useSocket();
  useAsync(async () => {
    const { downloads } = await socket.query(queries.getDownloads);
    mergeDownloads(downloads);
  }, [filter]);

  let downloadChanged = ({ download }: { download: Download }) => {
    mergeDownloads({ [download.id]: download });
  };
  useListen(socket, packets.downloadStarted, downloadChanged, []);
  useListen(socket, packets.downloadChanged, downloadChanged, []);
  useListen(
    socket,
    packets.downloadCleared,
    ({ download }) => {
      setDownloads(old => _.omit(old, download.id));
    },
    []
  );

  return downloads;
}
