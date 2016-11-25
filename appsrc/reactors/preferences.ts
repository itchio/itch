
import {Watcher} from "./watcher";

import pathmaker from "../util/pathmaker";
import {camelifyObject} from "../util/format";
import sf from "../util/sf";

import * as actions from "../actions";

import mklog from "../util/log";
const log = mklog("preferences");
import {opts} from "../logger";

let saveAtomicInvocations = 0;

import {initialState} from "../reducers/preferences";

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    let prefs: any = {};

    try {
      const contents = await sf.readFile(pathmaker.preferencesPath());
      prefs = camelifyObject(JSON.parse(contents));
    } catch (err) {
      log(opts, `while importing preferences: ${err}`);
    }

    log(opts, "imported preferences: ", JSON.stringify(prefs, null, 2));
    store.dispatch(actions.updatePreferences(prefs));
    store.dispatch(actions.preferencesLoaded(Object.assign({}, initialState, prefs)));
  });

  watcher.on(actions.updatePreferences, async (store, action) => {
    const prefs = store.getState().preferences;

    // write prefs atomically
    const file = pathmaker.preferencesPath();
    const tmpPath = file + ".tmp" + (saveAtomicInvocations++);
    await sf.writeFile(tmpPath, JSON.stringify(prefs));
    await sf.rename(tmpPath, file);
  });
}
