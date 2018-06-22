import { actions } from "common/actions";
import { Watcher } from "common/util/watcher";

import { createSelector } from "reselect";

import { IRootState } from "common/types";

import rootLogger from "common/logger";
import { Space } from "common/helpers/space";
import { shell } from "electron";
import uuid from "common/util/uuid";
const logger = rootLogger.child({ name: "reactors/navigation" });

import { opensInWindow } from "common/constants/windows";
import { getNativeWindow } from "main/reactors/main-window";

export default function(watcher: Watcher) {
  watcher.on(actions.clearFilters, async (store, action) => {
    store.dispatch(
      actions.updatePreferences({
        onlyCompatibleGames: false,
        onlyInstalledGames: false,
        onlyOwnedGames: false,
      })
    );
  });

  watcher.on(actions.commandGoBack, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    store.dispatch(actions.tabGoBack({ window, tab }));
  });

  watcher.on(actions.commandGoForward, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    store.dispatch(actions.tabGoForward({ window, tab }));
  });

  watcher.on(actions.commandReload, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    store.dispatch(actions.tabReloaded({ window, tab }));
  });

  watcher.on(actions.navigateTab, async (store, action) => {
    const { background } = action.payload;

    if (background) {
      store.dispatch(actions.navigate(action.payload));
    } else {
      const { background, ...rest } = action.payload;
      store.dispatch(
        actions.evolveTab({
          ...rest,
          replace: false,
        })
      );
    }
  });

  watcher.on(actions.navigate, async (store, action) => {
    const { url, resource, data, window, background } = action.payload;
    logger.debug(`Navigating to ${url} ${background ? "(in background)" : ""}`);

    if (window === "root" && opensInWindow[url]) {
      store.dispatch(
        actions.openWindow({
          initialURL: url,
          modal: false,
          role: "secondary",
        })
      );
      return;
    }

    const space = Space.fromInstance("fictional-tab", {
      history: [{ url, resource }],
      currentIndex: 0,
      sequence: 0,
      data,
    });
    if (space.protocol() == "mailto:") {
      logger.debug(`Is mailto link, opening as external and skipping tab open`);
      shell.openExternal(space.suffix);
      return;
    }

    const rs = store.getState();
    const { enableTabs } = rs.preferences;
    if (enableTabs && window === "root") {
      const nativeWindow = getNativeWindow(rs, "root");
      if (nativeWindow && nativeWindow.isFocused()) {
        // let it navigate the open tab
      } else {
        // open a new tab!
        store.dispatch(
          actions.openTab({
            window,
            tab: uuid(),
            url,
            resource,
            background,
            data,
          })
        );
        store.dispatch(
          actions.focusWindow({
            window,
          })
        );
        return;
      }
    }

    {
      const { navigation } = rs.windows[window];
      const tab = navigation.tab;

      // navigate the single tab
      store.dispatch(
        actions.evolveTab({
          tab,
          replace: false,
          window,
          url,
          resource: resource ? resource : null,
          data,
        })
      );
      store.dispatch(
        actions.focusWindow({
          window,
        })
      );
    }
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { window } = action.payload;
    const { openTabs } = store.getState().windows[window].navigation;

    for (const tab of openTabs) {
      store.dispatch(actions.closeTab({ window, tab }));
    }
  });

  watcher.on(actions.closeOtherTabs, async (store, action) => {
    const { window } = action.payload;
    const safeTab = action.payload.tab;
    const { openTabs } = store.getState().windows[window].navigation;

    for (const tab of openTabs) {
      if (tab !== safeTab) {
        store.dispatch(actions.closeTab({ window, tab }));
      }
    }
  });

  watcher.on(actions.closeTabsBelow, async (store, action) => {
    const { window } = action.payload;
    const markerTab = action.payload.tab;
    const { openTabs } = store.getState().windows[window].navigation;

    // woo !
    let closing = false;
    for (const tab of openTabs) {
      if (closing) {
        store.dispatch(actions.closeTab({ window, tab }));
      } else if (tab === markerTab) {
        // will start closing after this one
        closing = true;
      }
    }
  });

  watcher.on(actions.closeCurrentTab, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    store.dispatch(actions.closeTab({ window, tab }));
  });

  let subWatcher: Watcher;

  const refreshSelectors = (rs: IRootState) => {
    watcher.removeSub(subWatcher);
    subWatcher = makeSubWatcher(rs);
    watcher.addSub(subWatcher);
  };

  watcher.on(actions.windowOpened, async (store, action) => {
    refreshSelectors(store.getState());
  });

  watcher.on(actions.windowClosed, async (store, action) => {
    refreshSelectors(store.getState());
  });
}

function makeSubWatcher(rs: IRootState) {
  const watcher = new Watcher();
  for (const window of Object.keys(rs.windows)) {
    watcher.onStateChange({
      makeSelector: (store, schedule) =>
        createSelector(
          (rs: IRootState) => rs.windows[window].navigation.tab,
          tab => schedule.dispatch(actions.tabChanged({ window, tab }))
        ),
    });

    watcher.onStateChange({
      makeSelector: (store, schedule) =>
        createSelector(
          (rs: IRootState) => rs.windows[window].navigation.openTabs,
          (rs: IRootState) => rs.windows[window].tabInstances,
          (rs: IRootState) => rs.windows[window].navigation.tab,
          (openTabs, tabInstances, tab) =>
            schedule.dispatch(actions.tabsChanged({ window }))
        ),
    });
  }
  return watcher;
}
