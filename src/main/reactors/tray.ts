import { Watcher } from "common/util/watcher";

import { app } from "electron";
const logger = mainLogger.child(__filename);
import * as _ from "underscore";

import { actions } from "common/actions";
import {
  getTray,
  rememberNotificationAction,
} from "main/reactors/tray-persistent-state";

import { Store, MenuTemplate } from "common/types";
import { fleshOutTemplate } from "main/reactors/context-menu/flesh-out-template";
import { memoize } from "common/util/lru-memoize";
import { currentRuntime } from "common/os/runtime";
import { mainLogger } from "main/logger";
import { mcall } from "main/butlerd/mcall";
import { messages } from "common/butlerd";
import { Menu } from "common/helpers/menu";

const setTrayMenu = memoize(1, function (template: MenuTemplate, store: Store) {
  const fleshedOut = fleshOutTemplate(
    "root",
    store,
    currentRuntime(),
    template
  );
  const menu = Menu.buildFromTemplate(fleshedOut);

  if (process.platform === "darwin") {
    // don't have a tray icon on macOS, we just live in the dock
    app.dock.setMenu(menu);
  } else {
    getTray(store).setContextMenu(menu);
  }
});

async function go(store: Store, url: string) {
  store.dispatch(actions.navigate({ wind: "root", url }));
}

async function refreshTray(store: Store) {
  const rs = store.getState();

  let menuTemplate: MenuTemplate = [];

  let append = (addition: MenuTemplate) => {
    if (menuTemplate.length > 0) {
      menuTemplate = [...menuTemplate, { type: "separator" }, ...addition];
    } else {
      menuTemplate = [...menuTemplate, ...addition];
    }
  };

  if (rs.setup.done) {
    try {
      const { items } = await mcall(messages.FetchCaves, {
        limit: 5,
        sortBy: "lastTouched",
      });
      if (!_.isEmpty(items)) {
        let caveItems: MenuTemplate = [];
        for (const cave of items) {
          caveItems.push({
            localizedLabel: cave.game.title,
            click: () => store.dispatch(actions.queueLaunch({ cave })),
          });
        }
        append(caveItems);
      }
    } catch (e) {
      logger.warn(`Could not fetch caves: ${e.stack}`);
    }
  }

  append([
    {
      localizedLabel: ["sidebar.explore"],
      click: () => go(store, "itch://featured"),
    },
    {
      localizedLabel: ["sidebar.library"],
      click: () => go(store, "itch://library"),
    },
    {
      localizedLabel: ["sidebar.collections"],
      click: () => go(store, "itch://collections"),
    },
  ]);

  append([
    {
      localizedLabel: ["sidebar.preferences"],
      click: () => go(store, "itch://preferences"),
    },
  ]);

  if (process.platform !== "darwin") {
    append([
      {
        localizedLabel: ["menu.file.quit"],
        click: () => store.dispatch(actions.quit({})),
      },
    ]);
  }
  setTrayMenu(menuTemplate, store);
}

export default function (watcher: Watcher) {
  watcher.on(actions.notify, async (store, action) => {
    const { onClick } = action.payload;
    rememberNotificationAction(onClick);
  });

  async function scheduleRefreshTray(store, action: any) {
    try {
      await refreshTray(store);
    } catch (e) {
      logger.error(`Could not refresh tray: ${e.stack}`);
    }
  }

  watcher.on(actions.setupDone, scheduleRefreshTray);
  watcher.on(actions.newItemsImported, scheduleRefreshTray);
  watcher.on(actions.downloadEnded, scheduleRefreshTray);
  watcher.on(actions.uninstallEnded, scheduleRefreshTray);
  watcher.on(actions.launchEnded, scheduleRefreshTray);
  watcher.on(actions.installLocationsChanged, scheduleRefreshTray);
}
