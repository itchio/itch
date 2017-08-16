import * as actions from "../actions";
import { Watcher } from "./watcher";

import staticTabData from "../constants/static-tab-data";

import { createSelector } from "reselect";

import { IAppState } from "../types";

import { contains } from "underscore";

export default function(watcher: Watcher) {
  watcher.on(actions.clearFilters, async (store, action) => {
    store.dispatch(
      actions.updatePreferences({
        onlyCompatibleGames: false,
        onlyInstalledGames: false,
        onlyOwnedGames: false,
      }),
    );
  });

  watcher.on(actions.navigate, async (store, action) => {
    const state = store.getState();
    const { tab, background } = action.payload;

    const { tabData } = state.session;

    const constantTabs = new Set<string>(
      state.session.navigation.tabs.constant,
    );

    if (constantTabs.has(tab)) {
      // switching to constant tab, that's good
      if (!background) {
        store.dispatch(actions.focusTab({ tab }));
      }
      return;
    }

    if (tabData[tab]) {
      // switching to existing tab by id - that's fine
      if (!background) {
        store.dispatch(actions.focusTab({ tab }));
      }
      return;
    }

    for (const tabId of Object.keys(tabData)) {
      if (tabData[tabId].path === tab) {
        // switching by path is cool
        if (!background) {
          store.dispatch(actions.focusTab({ tab: tabId }));
        }
        return;
      }
    }

    const { data } = action.payload;

    // must be a new tab then!
    if (staticTabData[tab]) {
      store.dispatch(
        actions.internalOpenTab({
          tab,
          background,
          data: {
            path: tab,
            ...data,
          },
        }),
      );
    } else {
      store.dispatch(
        actions.openTab({
          background,
          data: {
            path: tab,
            ...data,
          },
        }),
      );
    }
  });

  watcher.on(actions.evolveTab, async (store, action) => {
    const { tab, path, extras } = action.payload;

    store.dispatch(
      actions.tabEvolved({
        tab,
        data: {
          path,
          ...extras,
        },
      }),
    );
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { transient } = store.getState().session.navigation.tabs;

    // woo !
    for (const tab of transient) {
      store.dispatch(actions.closeTab({ tab }));
    }
  });

  watcher.on(actions.closeCurrentTab, async (store, action) => {
    const { tabs, tab } = store.getState().session.navigation;
    const { transient } = tabs;

    if (contains(transient, tab)) {
      store.dispatch(actions.closeTab({ tab }));
    }
  });

  watcher.on(actions.downloadStarted, async (store, action) => {
    store.dispatch(actions.navigate({ tab: "downloads", background: true }));
  });

  let pathSelector: (state: IAppState) => void;

  watcher.onAll(async (store, action) => {
    if (!pathSelector) {
      pathSelector = createSelector(
        (state: IAppState) => state.session.navigation.tab,
        tab => {
          setImmediate(() => {
            store.dispatch(actions.tabChanged({ tab }));
          });
        },
      );
    }
    pathSelector(store.getState());
  });
}
