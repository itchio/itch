import * as os from "main/os";

import { classificationActions } from "common/constants/classification-actions";
import { Game, GameType, GameClassification } from "common/butlerd/messages";
import { camelify } from "common/format/camelify";

const platform = os.itchPlatform();
const platformProp = camelify("p_" + platform);

export function isPlatformCompatible(game: Game): boolean {
  const hasTaggedPlatform = !!(game as any)[platformProp];
  const isHTMLGame = game.type === GameType.HTML;
  const isOpenable =
    classificationActions[game.classification || GameClassification.Game] ===
    "open";
  return hasTaggedPlatform || isHTMLGame || isOpenable;
}
