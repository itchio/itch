
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

export default function (watcher: Watcher) {
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
}
