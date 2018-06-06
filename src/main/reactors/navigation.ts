import { actions } from "common/actions";
import { Watcher } from "common/util/watcher";

import staticTabData from "common/constants/static-tab-data";

import { createSelector } from "reselect";
import { contains } from "underscore";

import { IRootState } from "common/types";

import rootLogger from "common/logger";
import { Space } from "common/helpers/space";
import { shell } from "electron";
import {
  userToTabData,
  gameEvolvePayload,
  collectionEvolvePayload,
  installLocationToTabData,
} from "common/util/navigation";
import uuid from "common/util/uuid";
const logger = rootLogger.child({ name: "reactors/navigation" });

import nodeURL from "url";
import querystring from "querystring";

export default function(watcher: Watcher) {
  watcher.on(actions.navigateToCollection, async (store, action) => {
    const { collection, background } = action.payload;
    store.dispatch(
      actions.navigate({
        ...collectionEvolvePayload(collection),
        background,
      })
    );
  });

  watcher.on(actions.navigateToGame, async (store, action) => {
    const { game, background } = action.payload;
    store.dispatch(
      actions.navigate({
        ...gameEvolvePayload(game),
        background,
      })
    );
  });

  watcher.on(actions.navigateToUser, async (store, action) => {
    const { user, background, window } = action.payload;
    store.dispatch(
      actions.navigate({
        window,
        url: `itch://users/${user.id}`,
        data: userToTabData(user),
        background,
      })
    );
  });

  watcher.on(actions.navigateToInstallLocation, async (store, action) => {
    const { installLocation, background, window } = action.payload;
    store.dispatch(
      actions.navigate({
        window,
        url: `itch://locations/${installLocation.id}`,
        data: installLocationToTabData(installLocation),
        background,
      })
    );
  });

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
    const { background, window, tab } = action.payload;
    const sp = Space.fromStore(store, window, tab);

    if (background) {
      store.dispatch(actions.navigate(action.payload));
    } else if (sp.isFrozen()) {
      const { tab, ...rest } = action.payload;

      store.dispatch(
        actions.navigate({
          ...rest,
          background: false,
        })
      );
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
    const rs = store.getState();
    const { url, resource, data, window, background } = action.payload;
    const windowState = rs.windows[window];
    logger.debug(`Navigating to ${url} ${background ? "(in background)" : ""}`);

    const sp = Space.fromInstance({
      history: [{ url, resource }],
      currentIndex: 0,
      data,
    });
    if (sp.protocol() == "mailto:") {
      logger.debug(`Is mailto link, opening as external and skipping tab open`);
      shell.openExternal(sp.suffix);
      return;
    }

    const { openTabs } = windowState.navigation;
    const constantTabs = new Set(openTabs.constant);
    const transientTabs = new Set(openTabs.transient);

    if (constantTabs.has(url) || transientTabs.has(url)) {
      // switching to constant or transient tab by url, that's good
      if (!background) {
        store.dispatch(actions.focusTab({ window, tab: url }));
      }
      return;
    }

    if (resource) {
      const tabInstances = windowState.tabInstances;
      for (const transient of openTabs.transient) {
        const ti = tabInstances[transient];
        if (ti && ti.history[ti.currentIndex].resource === resource) {
          // switching to transient by resource, I like your style
          if (!background) {
            store.dispatch(actions.focusTab({ window, tab: transient }));
          }
          return;
        }
      }
    }

    const staticData = staticTabData[url];

    // must be a new tab then!
    if (staticData) {
      store.dispatch(
        actions.openTab({
          window,
          tab: url,
          url,
          background,
        })
      );
    } else {
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
    }
  });

  watcher.on(actions.tabParamsChanged, async (store, action) => {
    let { tab, params, window } = action.payload;
    const sp = Space.fromStore(store, window, tab);

    const newParams = {
      ...sp.query(),
      ...params,
    };

    const previousURL = sp.url();
    const parsed = nodeURL.parse(previousURL);
    const { host, protocol, pathname } = parsed;
    const newURL = nodeURL.format({
      host,
      protocol,
      pathname,
      slashes: true,
      search: `?${querystring.stringify(newParams)}`,
    });

    store.dispatch(
      actions.evolveTab({
        window,
        tab,
        url: newURL,
        replace: true,
        onlyParamsChange: true,
      })
    );
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { window } = action.payload;
    const { transient } = store.getState().windows[window].navigation.openTabs;

    // woo !
    for (const tab of transient) {
      store.dispatch(actions.closeTab({ window, tab }));
    }
  });

  watcher.on(actions.closeOtherTabs, async (store, action) => {
    const { window } = action.payload;
    const safeTab = action.payload.tab;
    const { transient } = store.getState().windows[window].navigation.openTabs;

    // woo !
    for (const tab of transient) {
      if (tab !== safeTab) {
        store.dispatch(actions.closeTab({ window, tab }));
      }
    }
  });

  watcher.on(actions.closeTabsBelow, async (store, action) => {
    const { window } = action.payload;
    const markerTab = action.payload.tab;
    const { transient } = store.getState().windows[window].navigation.openTabs;

    // woo !
    let closing = false;
    for (const tab of transient) {
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
    const { openTabs, tab } = store.getState().windows[window].navigation;
    const { transient } = openTabs;

    if (contains(transient, tab)) {
      store.dispatch(actions.closeTab({ window, tab }));
    }
  });

  watcher.on(actions.downloadQueued, async (store, action) => {
    store.dispatch(
      actions.navigate({
        window: "root",
        url: "itch://downloads",
        background: true,
      })
    );
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
