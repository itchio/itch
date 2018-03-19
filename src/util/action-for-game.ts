import { ClassificationAction } from "../types";
import classificationActions from "../constants/classification-actions";

import { Game, CaveSummary } from "../buse/messages";

/**
 * Returns whether a game can be "launched" or "opened", where "launching" means
 * starting an executable, serving a web game, etc., and "opening" means showing files
 * in a file explorer.
 */
function actionForGame(
  game: Game,
  cave: CaveSummary | null
): ClassificationAction {
  // FIXME: we're not using the cave at all here - we probably should.
  return classificationActions[game.classification] || "launch";
}

export default actionForGame;
