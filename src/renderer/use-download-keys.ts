import { messages } from "common/butlerd";
import { DownloadKey } from "@itchio/valet/messages";
import _ from "lodash";
import { useState } from "react";
import { useProfile } from "renderer/contexts";
import { useAsync } from "renderer/use-async";
import { socket } from "renderer";

export type DownloadKeys = {
  [key: number]: DownloadKey;
};

export function useDownloadKeys(filters?: { gameId?: number }): DownloadKeys {
  const profile = useProfile();

  const [keys, setKeys] = useState<DownloadKeys>({});

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
