
import {Watcher} from "./watcher";
import {createSelector} from "reselect";

import {languageChanged} from "../actions";

import {IStore, IState} from "../types";

const makeSelector = (store: IStore) => createSelector(
  (state: IState) => state.system.sniffedLanguage,
  (state: IState) => state.preferences.lang,
  (systemLang, prefLang) => {
    const lang = prefLang || systemLang || "en";
    setImmediate(() => {
      store.dispatch(languageChanged({lang}));
    });
  }
);
let selector: (state: IState) => void;

export default function (watcher: Watcher) {
  watcher.onAll(async (store, action) => {
    if (!selector) {
      selector = makeSelector(store);
    }
    selector(store.getState());
  })
}
