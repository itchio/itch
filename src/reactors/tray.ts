import { Watcher } from "./watcher";

import * as os from "../os";
import { app, Menu } from "electron";

import { createSelector } from "reselect";

import * as actions from "../actions";
import { getTray, rememberNotificationAction } from "./get-tray";

import {
  IStore,
  IRootState,
  II18nState,
  currentRuntime,
  IMenuTemplate,
} from "../types";
import { fleshOutTemplate } from "./context-menu/flesh-out-template";
import memoize from "../util/lru-memoize";

const setTrayMenu = memoize(1, function(
  template: IMenuTemplate,
  store: IStore
) {
  const fleshedOut = fleshOutTemplate(store, currentRuntime(), template);
  const menu = Menu.buildFromTemplate(fleshedOut);

  if (os.platform() === "darwin") {
    // don't have a tray icon on macOS, we just live in the dock
    app.dock.setMenu(menu);
  } else {
    getTray(store).setContextMenu(menu);
  }
});

async function go(store: IStore, path: string) {
  store.dispatch(actions.focusWindow({}));
  store.dispatch(actions.navigate({ tab: path }));
}

function refreshTray(store: IStore, i18n: II18nState) {
  // TODO: make the tray a lot more useful? that'd be good.
  // (like: make it display recent stuff / maybe the last few tabs)

  const menuTemplate: IMenuTemplate = [
    { localizedLabel: ["sidebar.owned"], click: () => go(store, "library") },
    {
      localizedLabel: ["sidebar.dashboard"],
      click: () => go(store, "dashboard"),
    },
  ];

  if (os.platform() !== "darwin") {
    menuTemplate.push({ type: "separator" });
    menuTemplate.push({
      localizedLabel: ["menu.file.quit"],
      click: () => store.dispatch(actions.quit({})),
    });
  }
  setTrayMenu(menuTemplate, store);
}

export default function(watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.i18n,
        i18n => {
          schedule(() => refreshTray(store, i18n));
        }
      ),
  });

  watcher.on(actions.notify, async (store, action) => {
    const { onClick } = action.payload;
    rememberNotificationAction(onClick);
  });
}
