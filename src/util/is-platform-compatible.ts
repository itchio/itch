import * as os from "../os";
import { camelify } from "../format";

import classificationActions from "../constants/classification-actions";
import { Game, GameType, GameClassification } from "ts-itchio-api";

const platform = os.itchPlatform();
const platformProp = camelify("p_" + platform);

export default function isPlatformCompatible(game: Game): boolean {
  const hasTaggedPlatform = !!(game as any)[platformProp];
  const isHTMLGame = game.type === GameType.HTML;
  const isOpenable =
    classificationActions[game.classification || GameClassification.Game] ===
    "open";
  return hasTaggedPlatform || isHTMLGame || isOpenable;
}
