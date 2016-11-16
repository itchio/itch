
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.triggerOk, async (store, action) => {
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
  });

  watcher.on(actions.triggerLocation, async (store, action) => {
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
  });

  watcher.on(actions.triggerBack, async (store, action) => {
    const searchBar = document.querySelector("#search") as HTMLElement;
    if (searchBar) {
      searchBar.blur();
    }

    const locationBar = document.querySelector(".hub-meat-tab.visible .browser-address") as HTMLElement;
    if (locationBar) {
      locationBar.blur();
    }
  });
}
