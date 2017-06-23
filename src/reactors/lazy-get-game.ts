import db from "../db";
import Game from "../db/models/game";

import client from "../api";

import { IStore } from "../types";
import { getGameCredentialsForId } from "./downloads/get-game-credentials";

export default async function lazyGetGame(
  store: IStore,
  gameId: number,
): Promise<Game> {
  const game = db.games.findOneById(gameId);
  if (game) {
    return game;
  }

  const gameCredentials = await getGameCredentialsForId(store, gameId);
  if (!gameCredentials) {
    return null;
  }

  const api = client.withKey(gameCredentials.apiKey);
  const gameResponse = await api.game(gameId);
  if (gameResponse) {
    return gameResponse.game;
  }

  return null;
}
