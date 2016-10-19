
import os from "./os";
import {camelify} from "./format";

import {IGameRecord} from "../types/db";

const platform = os.itchPlatform();
const platformProp = camelify("p_" + platform);

export default function isPlatformCompatible (game: IGameRecord): boolean {
  return !!(game as any)[platformProp] || game.type === "html";
}
