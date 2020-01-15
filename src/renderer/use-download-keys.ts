import { messages } from "common/butlerd";
import { DownloadKey } from "common/butlerd/messages";
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
  useAsync(async () => {
    if (!profile) {
      return;
    }

    const { items } = await socket.call(messages.FetchDownloadKeys, {
      profileId: profile.id,
      filters,
    });
    setKeys(_.keyBy(items, k => k.id));
  }, [JSON.stringify(filters)]);

  return keys;
}
