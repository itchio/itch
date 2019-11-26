import { actions } from "common/actions";
import { camelifyObject } from "common/format/camelify";
import { initialState } from "common/reducers/preferences";
import { PreferencesState, Store } from "common/types";
import { preferencesPath } from "common/util/paths";
import fs from "fs";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

async function loadPreferences(store: Store) {
  const prefs = loadPreferencesSync();
  store.dispatch(actions.updatePreferences(prefs));
  store.dispatch(actions.preferencesLoaded(prefs));
}

export default loadPreferences;

export function loadPreferencesSync(): PreferencesState {
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

function mergePreferences(contents: string): PreferencesState {
  return {
    ...initialState,
    ...camelifyObject(JSON.parse(contents)),
  };
}
