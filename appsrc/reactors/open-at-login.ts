
import {Watcher} from "./watcher";
import * as actions from "../actions";

import mklog from "../util/log";
const log = mklog("reactors/open-at-login");
import {opts} from "../logger";

import {createSelector} from "reselect";

import {IStore, IPreferencesState} from "../types";

async function updateOpenAtLoginState(store: IStore, openAtLogin: boolean, openAsHidden: boolean) {
  // TODO: linux support via autostart symlink
  log(opts, `Updating login item settings, open: ${openAtLogin}, hidden: ${openAsHidden}`);

  const app = require("electron").app;
  app.setLoginItemSettings({
    openAtLogin: openAtLogin,
    openAsHidden: openAsHidden,
  });
}

let cachedSelector: (prefs: IPreferencesState) => void;
function getSelector (store: IStore) {
  if (!cachedSelector) {
    cachedSelector = createSelector(
      (prefs: IPreferencesState) => prefs.openAtLogin,
      (prefs: IPreferencesState) => prefs.openAsHidden,
      (openAtLogin: boolean, openAsHidden: boolean) => {
        updateOpenAtLoginState(store, openAtLogin, openAsHidden);
      }
    );
  }

  return cachedSelector;
}

export default function (watcher: Watcher) {
  watcher.on(actions.updatePreferences, async (store, action) => {
    const selector = getSelector(store);
    selector(store.getState().preferences);
  });
};
