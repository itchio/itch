
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

export default function (watcher: Watcher) {
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
