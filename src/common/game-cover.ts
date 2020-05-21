import { Game } from "@itchio/valet/messages";

export function gameCover(game: Game): string | undefined {
  return game.stillCoverUrl ?? game.coverUrl ?? undefined;
}
