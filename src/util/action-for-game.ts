
import {ClassificationAction} from "../types";
import classificationActions from "../constants/classification-actions";

import GameModel from "../db/models/game";
import CaveModel from "../db/models/cave";

/**
 * Returns whether a game can be "launched" or "opened", where "launching" means
 * starting an executable, serving a web game, etc., and "opening" means showing files
 * in a file explorer.
 */
export default function actionForGame (game: GameModel, cave: CaveModel): ClassificationAction {
  if (cave != null && cave.launchType === "html") {
    return "launch";
  }

  return classificationActions[game.classification] || "launch";
}
