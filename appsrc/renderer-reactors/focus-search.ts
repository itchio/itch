
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

import delay from "../reactors/delay";

export default function (watcher: Watcher) {
  watcher.on(actions.closeSearch, async (store, action) => {
    const searchBar = document.querySelector("#search") as HTMLInputElement;
    // hasFocus(Element) isn't in typescript typings
    if (searchBar && (document as any).hasFocus(searchBar)) {
      searchBar.blur();
    }
  });

  watcher.on(actions.focusFilter, async (store, action) => {
    const filterBar = document.querySelector(".hub-meat-tab.visible .filter-input-field") as HTMLInputElement;
    if (filterBar) {
      filterBar.focus();
      filterBar.select();
    }
  });

  watcher.on(actions.clearFilters, async (store, action) => {
    const filterBar = document.querySelector(".hub-meat-tab.visible .filter-input-field") as HTMLInputElement;
    if (filterBar) {
      filterBar.value = "";
    }
  });

  watcher.on(actions.searchHighlightOffset, async (store, action) => {
    // FIXME: delay is bad
    await delay(20);
    const searchResults = document.querySelector(".hub-search-results.active");
    if (searchResults) {
      const chosen = searchResults.querySelector(".search-result.chosen");
      if (chosen) {
        // this isn't part of DOM spec yet apparently? at least not typescript typings
        // but electron is powered by blink which definitely ahs it
        (chosen as any).scrollIntoViewIfNeeded();
      }
    }
  });
}
