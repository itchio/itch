import * as sf from "../../os/sf";
import { camelifyObject } from "../../format";
import { initialState } from "../../reducers/preferences";
import { preferencesPath } from "../../os/paths";

import rootLogger from "../../logger";
import { IStore } from "../../types/index";
const logger = rootLogger.child({ name: "load-preferences" });

import { actions } from "../../actions";

export default async function loadPreferences(store: IStore) {
  let prefs: any = {};

  try {
    const contents = await sf.readFile(preferencesPath(), {
      encoding: "utf8",
    });
    prefs = camelifyObject(JSON.parse(contents));
    logger.debug(`imported preferences: ${JSON.stringify(prefs)}`);
  } catch (err) {
    if (err.code === "ENOENT") {
      logger.info(`no preferences yet. fresh start!`);
    } else {
      logger.warn(`while importing preferences: ${err.stack}`);
    }
  }

  store.dispatch(actions.updatePreferences(prefs));
  store.dispatch(actions.preferencesLoaded({ ...initialState, ...prefs }));
}
