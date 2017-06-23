import { Watcher } from "./watcher";
import { createSelector } from "reselect";

import { languageChanged } from "../actions";

import { IStore, IAppState } from "../types";

const makeSelector = (store: IStore) =>
  createSelector(
    (state: IAppState) => state.system.sniffedLanguage,
    (state: IAppState) => state.preferences.lang,
    (systemLang, prefLang) => {
      const lang = prefLang || systemLang || "en";
      setImmediate(() => {
        store.dispatch(languageChanged({ lang }));
      });
    },
  );
let selector: (state: IAppState) => void;

export default function(watcher: Watcher) {
  watcher.onAll(async (store, action) => {
    if (!selector) {
      selector = makeSelector(store);
    }
    selector(store.getState());
  });
}
