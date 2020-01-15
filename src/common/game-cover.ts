import { Game } from "common/butlerd/messages";

export function gameCover(game: Game): string | undefined {
  return game.stillCoverUrl ?? game.coverUrl ?? undefined;
}
