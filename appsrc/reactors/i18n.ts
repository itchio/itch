
import {createSelector} from "reselect";

import {languageChanged} from "../actions";

import {IStore, IState} from "../types";
import {IAction} from "../constants/action-types";

const makeSelector = (store: IStore) => createSelector(
  (state: IState) => state.system.sniffedLanguage,
  (state: IState) => state.preferences.lang,
  (systemLang, prefLang) => {
    const lang = prefLang || systemLang || "en";
    setImmediate(() => {
      store.dispatch(languageChanged(lang));
    });
  }
);
let selector: (state: IState) => void;

async function catchAll (store: IStore, action: IAction<any>) {
  if (!selector) {
    selector = makeSelector(store);
  }
  selector(store.getState());
}

export default {catchAll};
