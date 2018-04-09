import { ClassificationAction } from "common/types";

import { Game, CaveSummary } from "common/butlerd/messages";
import { classificationActions } from "common/constants/classification-actions";

/**
 * Returns whether a game can be "launched" or "opened", where "launching" means
 * starting an executable, serving a web game, etc., and "opening" means showing files
 * in a file explorer.
 */
export function actionForGame(
  game: Game,
  cave: CaveSummary | null
): ClassificationAction {
  // FIXME: we're not using the cave at all here - we probably should.
  return classificationActions[game.classification] || "launch";
}
