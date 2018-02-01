import * as fs from "fs";
import { camelifyObject } from "../../format";
import { initialState } from "../../reducers/preferences";
import { preferencesPath } from "../../os/paths";

import rootLogger from "../../logger";
import { IStore, IPreferencesState } from "../../types/index";
const logger = rootLogger.child({ name: "load-preferences" });

import { actions } from "../../actions";

export default async function loadPreferences(store: IStore) {
  const prefs = loadPreferencesSync();
  store.dispatch(actions.updatePreferences(prefs));
  store.dispatch(actions.preferencesLoaded(prefs));
}

export function loadPreferencesSync(): IPreferencesState {
  let prefs = initialState;

  try {
    const contents = fs.readFileSync(preferencesPath(), {
      encoding: "utf8",
    });
    prefs = mergePreferences(contents);
    logger.debug(`imported preferences: ${JSON.stringify(prefs)}`);
  } catch (e) {
    if (e.code === "ENOENT") {
      // ignore
    } else {
      logger.warn(`while importing preferences: ${e.stack}`);
    }
  }

  return prefs;
}

function mergePreferences(contents: string): IPreferencesState {
  return {
    ...initialState,
    ...camelifyObject(JSON.parse(contents)),
  };
}
