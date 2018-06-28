import { actions } from "common/actions";
import { opensInWindow } from "common/constants/windows";
import { Space } from "common/helpers/space";
import { RootState } from "common/types";
import uuid from "common/util/uuid";
import { Watcher } from "common/util/watcher";
import { shell } from "electron";
import { mainLogger } from "main/logger";
import { getNativeWindow } from "main/reactors/winds";
import { createSelector } from "reselect";

const logger = mainLogger.child(__filename);

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
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(actions.tabGoBack({ wind, tab }));
  });

  watcher.on(actions.commandGoForward, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(actions.tabGoForward({ wind, tab }));
  });

  watcher.on(actions.commandReload, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(actions.tabReloaded({ wind, tab }));
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
    const { url, resource, data, wind, background, replace } = action.payload;
    logger.debug(`Navigating to ${url} ${background ? "(in background)" : ""}`);

    if (wind === "root" && opensInWindow[url]) {
      store.dispatch(
        actions.openWind({
          initialURL: url,
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
    if (enableTabs && wind === "root") {
      const nativeWindow = getNativeWindow(rs, "root");
      if (nativeWindow && nativeWindow.isFocused()) {
        // let it navigate the open tab
      } else {
        // open a new tab!
        store.dispatch(
          actions.openTab({
            wind,
            tab: uuid(),
            url,
            resource,
            background,
            data,
          })
        );
        store.dispatch(
          actions.focusWind({
            wind,
          })
        );
        return;
      }
    }

    {
      const { navigation } = rs.winds[wind];
      const tab = navigation.tab;

      // navigate the single tab
      store.dispatch(
        actions.evolveTab({
          tab,
          replace,
          wind,
          url,
          resource: resource ? resource : null,
          data,
        })
      );
      store.dispatch(
        actions.focusWind({
          wind,
        })
      );
    }
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { wind } = action.payload;
    const { openTabs } = store.getState().winds[wind].navigation;

    for (const tab of openTabs) {
      store.dispatch(actions.closeTab({ wind, tab }));
    }
  });

  watcher.on(actions.closeOtherTabs, async (store, action) => {
    const { wind } = action.payload;
    const safeTab = action.payload.tab;
    const { openTabs } = store.getState().winds[wind].navigation;

    for (const tab of openTabs) {
      if (tab !== safeTab) {
        store.dispatch(actions.closeTab({ wind, tab }));
      }
    }
  });

  watcher.on(actions.closeTabsBelow, async (store, action) => {
    const { wind } = action.payload;
    const markerTab = action.payload.tab;
    const { openTabs } = store.getState().winds[wind].navigation;

    // woo !
    let closing = false;
    for (const tab of openTabs) {
      if (closing) {
        store.dispatch(actions.closeTab({ wind, tab }));
      } else if (tab === markerTab) {
        // will start closing after this one
        closing = true;
      }
    }
  });

  watcher.on(actions.closeCurrentTab, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(actions.closeTab({ wind, tab }));
  });

  let subWatcher: Watcher;

  const refreshSelectors = (rs: RootState) => {
    watcher.removeSub(subWatcher);
    subWatcher = makeSubWatcher(rs);
    watcher.addSub(subWatcher);
  };

  watcher.on(actions.windOpened, async (store, action) => {
    refreshSelectors(store.getState());
  });

  watcher.on(actions.windClosed, async (store, action) => {
    refreshSelectors(store.getState());
  });
}

function makeSubWatcher(rs: RootState) {
  const watcher = new Watcher(mainLogger);
  for (const wind of Object.keys(rs.winds)) {
    watcher.onStateChange({
      makeSelector: (store, schedule) =>
        createSelector(
          (rs: RootState) => rs.winds[wind].navigation.tab,
          tab => schedule.dispatch(actions.tabChanged({ wind, tab }))
        ),
    });

    watcher.onStateChange({
      makeSelector: (store, schedule) =>
        createSelector(
          (rs: RootState) => rs.winds[wind].navigation.openTabs,
          (rs: RootState) => rs.winds[wind].tabInstances,
          (rs: RootState) => rs.winds[wind].navigation.tab,
          (openTabs, tabInstances, tab) =>
            schedule.dispatch(actions.tabsChanged({ wind }))
        ),
    });
  }
  return watcher;
}
