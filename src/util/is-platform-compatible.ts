import * as os from "../os";

import classificationActions from "../constants/classification-actions";
import { Game, GameType, GameClassification } from "../buse/messages";
import { camelify } from "../format/camelify";

const platform = os.itchPlatform();
const platformProp = camelify("p_" + platform);

function isPlatformCompatible(game: Game): boolean {
  const hasTaggedPlatform = !!(game as any)[platformProp];
  const isHTMLGame = game.type === GameType.HTML;
  const isOpenable =
    classificationActions[game.classification || GameClassification.Game] ===
    "open";
  return hasTaggedPlatform || isHTMLGame || isOpenable;
}

export default isPlatformCompatible;
