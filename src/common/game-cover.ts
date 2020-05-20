import { Game } from "@itchio/valet";

export function gameCover(game: Game): string | undefined {
  return game.stillCoverUrl ?? game.coverUrl ?? undefined;
}
