import { useSocket } from "renderer/contexts";
import { useEffect, useState } from "react";
import { Game } from "common/butlerd/messages";
import { messages } from "common/butlerd";

export function useGame(gameId?: number): Game | undefined {
  const socket = useSocket();
  const [game, setGame] = useState<Game | undefined>(undefined);

  useEffect(() => {
    if (!gameId) {
      setGame(undefined);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        {
          const { game } = await socket.call(messages.FetchGame, {
            gameId,
          });
          if (cancelled) {
            return;
          }
          setGame(game);
        }

        {
          const { game } = await socket.callWithRefresh(messages.FetchGame, {
            gameId,
          });
          if (cancelled) {
            return;
          }
          setGame(game);
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        setGame(undefined);
        throw e;
      }
    })().catch(e => console.warn(e));
    return () => {
      cancelled = true;
    };
  }, [gameId, socket]);

  return game;
}
