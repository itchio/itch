import { messages } from "common/butlerd";
import { Cave } from "common/butlerd/messages";
import { packets } from "common/packets";
import _ from "lodash";
import { useState, useCallback } from "react";
import { useSocket } from "renderer/contexts";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";

export interface Caves {
  [key: string]: Cave;
}

interface CaveFilter {
  gameId?: number;
}

export function useCaves(filter?: CaveFilter): Caves {
  const filterState = JSON.stringify(filter);

  const [caves, setCaves] = useState<Caves>({});
  const [fetchNumber, setFetchNumber] = useState(0);

  const socket = useSocket();
  useAsync(
    async () => {
      const { items } = await socket.call(messages.FetchCaves, {
        filters: filter,
      });
      setCaves(_.keyBy(items, c => c.id));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterState, fetchNumber]
  );

  const pokeGame = useCallback(
    (gameId?: number) => {
      if (filter?.gameId ? gameId == filter?.gameId : true) {
        setFetchNumber(x => x + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterState]
  );

  useListen(
    socket,
    packets.gameInstalled,
    params => pokeGame(params.cave.game?.id),
    [filterState]
  );
  useListen(
    socket,
    packets.gameUninstalled,
    params => pokeGame(params.gameId),
    [filterState]
  );

  return caves;
}
