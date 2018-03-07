import { IGameCredentials } from "../../types";
import Context from "../../context";

import { Game } from "../../buse/messages";

export default function getGameCredentials(
  ctx: Context,
  game: Game
): IGameCredentials {
  return getGameCredentialsInternal(ctx, game.id, game.inPressSystem);
}

export function getGameCredentialsForId(
  ctx: Context,
  gameId: number
): IGameCredentials {
  return getGameCredentialsInternal(ctx, gameId, false);
}

function getGameCredentialsInternal(
  ctx: Context,
  gameId: number,
  inPressSystem: boolean
): IGameCredentials {
  throw new Error("getGameCredentials is deprecated, pending removal");
}
