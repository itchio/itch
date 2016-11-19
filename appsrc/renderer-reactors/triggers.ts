
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

export default function (watcher: Watcher) {
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
