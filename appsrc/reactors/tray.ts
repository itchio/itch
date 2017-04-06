
import {Watcher} from "./watcher";

import os from "../util/os";
import localizer from "../localizer";
import {app, Menu, Tray, IMenuTemplate} from "../electron";

import {createSelector} from "reselect";

import * as actions from "../actions";

import {IStore, IAppState, II18nState} from "../types";
import {Action} from "redux-actions";

import {EventEmitter} from "events";

// used to glue balloon click with notification callbacks
let lastNotificationAction: Action<any>;

interface IBalloonOpts {
  title: string;
  icon: string;
  content: string;
}

interface ITray extends EventEmitter {
  setToolTip(message: string): void;
  setContextMenu(menu: IMenuTemplate): void;
  displayBalloon(opts: IBalloonOpts): void;
}
let tray: ITray;

function makeTray (store: IStore) {
  // cf. https://github.com/itchio/itch/issues/462
  // windows still displays a 16x16, whereas
  // some linux DEs don't know what to do with a @x2, etc.
  let suffix = "";
  if (os.platform() !== "linux") {
    suffix = "-small";
  }

  let base = "white";
  if (os.platform() === "win32" && !/^10\./.test(os.release())) {
    // windows older than 10 get the old colorful tray icon
    base = app.getName();
  }

  const iconName = `${base}${suffix}.png`;
  const iconPath = require("../static/images/tray/" + iconName);
  tray = new Tray(iconPath);
  tray.setToolTip("itch.io");
  tray.on("click", () => store.dispatch(actions.focusWindow({toggle: true})));
  tray.on("double-click", () => store.dispatch(actions.focusWindow({})));
  tray.on("balloon-click", () => {
    if (lastNotificationAction) {
      store.dispatch(lastNotificationAction);
    }
  });
}

function setMenu (trayMenu: IMenuTemplate, store: IStore) {
  if (os.platform() === "darwin") {
    // don't have a tray icon on macOS, we just live in the dock
    app.dock.setMenu(trayMenu);
  } else {
    if (!tray) {
      makeTray(store);
    }
    tray.setContextMenu(trayMenu);
  }
}

async function go (store: IStore, path: string) {
  store.dispatch(actions.focusWindow({}));
  store.dispatch(actions.navigate(path));
}

function refreshTray (store: IStore, i18n: II18nState) {
  const t = localizer.getT(i18n.strings, i18n.lang);
  const menuTemplate: IMenuTemplate = [
    {label: t("sidebar.owned"), click: () => go(store, "library")},
    {label: t("sidebar.dashboard"), click: () => go(store, "dashboard")},
  ];

  if (os.platform() !== "darwin") {
    menuTemplate.push({type: "separator"});
    menuTemplate.push({
      label: t("menu.file.quit"),
      click: () => store.dispatch(actions.quit({})),
    });
  }

  const trayMenu = Menu.buildFromTemplate(menuTemplate);
  setMenu(trayMenu, store);
}

// TODO: make the tray a lot more useful? that'd be good.
// (like: make it display recent stuff / maybe the last few tabs)

let traySelector: (state: IAppState, props?: any) => void;
const makeTraySelector = (store: IStore) => createSelector(
  (state: IAppState) => state.i18n,
  (i18n) => {
    setImmediate(() => {
      refreshTray(store, i18n);
    });
  },
);

let hasBooted = false;

export function getTray () {
  return tray;
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    hasBooted = true;
  });

  watcher.onAll(async (store, action) => {
    if (!hasBooted) {
      return;
    }
    if (!traySelector) {
      traySelector = makeTraySelector(store);
    }
    traySelector(store.getState());
  });

  watcher.on(actions.notify, async (store, action) => {
    lastNotificationAction = action.payload.onClick;
  });
}
