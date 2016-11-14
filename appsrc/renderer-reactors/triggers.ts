
import * as actions from "../actions";

import {IStore} from "../types";
import {
  IAction,
  ITriggerOkPayload,
  ITriggerLocationPayload,
  ITriggerBackPayload,
} from "../constants/action-types";

async function triggerOk (store: IStore, action: IAction<ITriggerOkPayload>) {
  const searchResults = document.querySelector(".hub-search-results.active");
  if (searchResults) {
    // results are open
    const chosen = searchResults.querySelector(".search-result.chosen");
    if (chosen) {
      const path = chosen.getAttribute("data-path");
      if (path) {
        store.dispatch(actions.navigate(path));
        store.dispatch(actions.closeSearch({}));
      }
    }
  }
}

async function triggerLocation (store: IStore, action: IAction<ITriggerLocationPayload>) {
  // cf. https://github.com/Microsoft/TypeScript/issues/3263
  // tl;dr typescript is right according to spec, but most of the time you want HTMLElement.
  const locationBar = document.querySelector(".hub-meat-tab.visible .browser-address") as HTMLElement;
  if (locationBar) {
    if (locationBar.tagName === "INPUT") {
      const locationInput = locationBar as HTMLInputElement;
      locationInput.focus();
      locationInput.select();
    } else {
      // TODO: figure out which DOM node type has click()
      locationBar.click();
    }
  }
}

async function triggerBack (store: IStore, action: IAction<ITriggerBackPayload>) {
  const searchBar = document.querySelector("#search") as HTMLElement;
  if (searchBar) {
    searchBar.blur();
  }

  const locationBar = document.querySelector(".hub-meat-tab.visible .browser-address") as HTMLElement;
  if (locationBar) {
    locationBar.blur();
  }
}

export default {triggerOk, triggerLocation, triggerBack};
