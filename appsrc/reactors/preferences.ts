
import {Watcher} from "./watcher";

import pathmaker from "../util/pathmaker";
import {camelifyObject} from "../util/format";
import sf from "../util/sf";

import * as actions from "../actions";

import mklog from "../util/log";
const log = mklog("preferences");
import {opts} from "../logger";

let saveAtomicInvocations = 0;

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    try {
      const contents = await sf.readFile(pathmaker.preferencesPath());
      const prefs = camelifyObject(JSON.parse(contents));

      log(opts, "imported preferences: ", JSON.stringify(prefs, null, 2));
      store.dispatch(actions.updatePreferences(prefs));
    } catch (err) {
      log(opts, `while importing preferences: ${err}`);
    }
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
