import { messages } from "common/butlerd";
import { DownloadKey } from "@itchio/valet";
import _ from "lodash";
import { useState } from "react";
import { useProfile, useSocket } from "renderer/contexts";
import { useAsync } from "renderer/use-async";

export type DownloadKeys = {
  [key: number]: DownloadKey;
};

export function useDownloadKeys(filters?: { gameId?: number }): DownloadKeys {
  const profile = useProfile();

  const [keys, setKeys] = useState<DownloadKeys>({});

  const socket = useSocket();
  useAsync(
    async () => {
      const { items } = await socket.call(messages.FetchDownloadKeys, {
        profileId: profile.id,
        filters,
      });
      setKeys(_.keyBy(items, (k) => k.id));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)]
  );

  return keys;
}
