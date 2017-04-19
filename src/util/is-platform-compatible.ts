
import os from "./os";
import {camelify} from "./format";

import {IGameRecord} from "../types";

import classificationActions from "../constants/classification-actions";

const platform = os.itchPlatform();
const platformProp = camelify("p_" + platform);

export default function isPlatformCompatible (game: IGameRecord): boolean {
  const hasTaggedPlatform = !!(game as any)[platformProp];
  const isHTMLGame = game.type === "html";
  const isOpenable = classificationActions[game.classification || "game"] === "open";
  return hasTaggedPlatform || isHTMLGame || isOpenable;
}
