import { messages } from "common/butlerd";
import { Cave } from "common/butlerd/messages";
import { packets } from "common/packets";
import _ from "lodash";
import { useState } from "react";
import { useSocket } from "renderer/contexts";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";

export interface Caves {
  [key: string]: Cave;
}

export function useCaves(filters?: { gameId?: number }): Caves {
  const [caves, setCaves] = useState<Caves>({});
  const [fetchNumber, setFetchNumber] = useState(0);

  const socket = useSocket();
  useAsync(async () => {
    const { items } = await socket.call(messages.FetchCaves, {
      filters,
    });
    setCaves(_.keyBy(items, c => c.id));
  }, [JSON.stringify(filters), fetchNumber]);

  const pokeGame = (gameId?: number) => {
    if (!filters?.gameId || gameId == filters?.gameId) {
      setFetchNumber(x => x + 1);
    }
  };

  useListen(
    socket,
    packets.gameInstalled,
    params => pokeGame(params.cave.game?.id),
    [filters?.gameId]
  );
  useListen(
    socket,
    packets.gameUninstalled,
    params => pokeGame(params.gameId),
    [filters?.gameId]
  );

  return caves;
}
