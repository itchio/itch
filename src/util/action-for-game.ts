import { ClassificationAction } from "../types";
import classificationActions from "../constants/classification-actions";

import GameModel from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";

/**
 * Returns whether a game can be "launched" or "opened", where "launching" means
 * starting an executable, serving a web game, etc., and "opening" means showing files
 * in a file explorer.
 */
export default function actionForGame(
  game: GameModel,
  cave: ICaveSummary | null,
): ClassificationAction {
  // FIXME: we're not using the cave at all here - we probably should.
  return classificationActions[game.classification] || "launch";
}
