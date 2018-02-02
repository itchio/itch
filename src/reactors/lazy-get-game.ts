import db from "../db";

import client from "../api";

import Context from "../context";
import { getGameCredentialsForId } from "./downloads/get-game-credentials";
import { Game } from "ts-itchio-api";

export default async function lazyGetGame(
  ctx: Context,
  gameId: number
): Promise<Game> {
  const game = db.games.findOneById(gameId);
  if (game) {
    return game;
  }

  const gameCredentials = getGameCredentialsForId(ctx, gameId);
  if (!gameCredentials) {
    return null;
  }

  return ctx.withStopper({
    stop: async () => null,
    work: async () => {
      const api = client.withKey(gameCredentials.apiKey);
      const gameRes = await api.game(gameId);
      if (gameRes) {
        return gameRes.entities.games[gameRes.result.gameId];
      }

      return null;
    },
  });
}
