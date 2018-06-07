import { Watcher } from "common/util/watcher";

import * as os from "../os";
import { app, Menu } from "electron";

import { createSelector } from "reselect";

import { actions } from "common/actions";
import { getTray, rememberNotificationAction } from "./tray-persistent-state";

import { IStore, IRootState, II18nState, IMenuTemplate } from "common/types";
import { fleshOutTemplate } from "./context-menu/flesh-out-template";
import { currentRuntime } from "main/os/runtime";
import { memoize } from "common/util/lru-memoize";

const setTrayMenu = memoize(1, function(
  template: IMenuTemplate,
  store: IStore
) {
  const fleshedOut = fleshOutTemplate(
    "root",
    store,
    currentRuntime(),
    template
  );
  const menu = Menu.buildFromTemplate(fleshedOut);

  if (os.platform() === "darwin") {
    // don't have a tray icon on macOS, we just live in the dock
    app.dock.setMenu(menu);
  } else {
    getTray(store).setContextMenu(menu);
  }
});

async function go(store: IStore, url: string) {
  // TODO: should navigate focus the window anyway ?
  store.dispatch(actions.focusWindow({ window: "root" }));
  store.dispatch(actions.navigate({ window: "root", url }));
}

function refreshTray(store: IStore, i18n: II18nState) {
  // TODO: make the tray a lot more useful? that'd be good.
  // (like: make it display recent stuff / maybe the last few tabs)

  const menuTemplate: IMenuTemplate = [
    {
      localizedLabel: ["sidebar.owned"],
      click: () => go(store, "itch://library"),
    },
    {
      localizedLabel: ["sidebar.dashboard"],
      click: () => go(store, "itch://dashboard"),
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
