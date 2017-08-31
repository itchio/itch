import * as actions from "../actions";
import { Watcher } from "./watcher";

import staticTabData from "../constants/static-tab-data";

import { createSelector } from "reselect";

import { IAppState } from "../types";

import { contains } from "underscore";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "reactors/navigation" });

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

  watcher.on(actions.navigate, async (store, action) => {
    const state = store.getState();
    const { tab, background } = action.payload;
    logger.debug(`Navigating to ${tab} ${background ? "(in background)" : ""}`);

    const { tabData } = state.session;

    const { tabs } = state.session.navigation;
    const constantTabs = new Set(tabs.constant);
    const transientTabs = new Set(tabs.transient);

    if (constantTabs.has(tab) || transientTabs.has(tab)) {
      // switching to constant or transient tab by id, that's good
      if (!background) {
        store.dispatch(actions.focusTab({ tab }));
      }
      return;
    }

    for (const existingTab of tabs.transient) {
      const td = tabData[existingTab];
      if (td && td.path === tab) {
        // switching by path is cool
        if (!background) {
          store.dispatch(actions.focusTab({ tab: existingTab }));
        }
        return;
      }
    }

    const { data } = action.payload;
    const staticData = staticTabData[tab];

    // must be a new tab then!
    if (staticData) {
      const { label, ...staticDataExceptId } = staticData;
      store.dispatch(
        actions.internalOpenTab({
          tab,
          background,
          data: {
            ...staticDataExceptId,
            ...data,
          },
        })
      );
    } else {
      store.dispatch(
        actions.openTab({
          background,
          data: {
            path: tab,
            ...data,
          },
        })
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
      })
    );
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { transient } = store.getState().session.navigation.tabs;

    // woo !
    for (const tab of transient) {
      store.dispatch(actions.closeTab({ tab }));
    }
  });

  watcher.on(actions.closeOtherTabs, async (store, action) => {
    const safeTab = action.payload.tab;
    const { transient } = store.getState().session.navigation.tabs;

    // woo !
    for (const tab of transient) {
      if (tab !== safeTab) {
        store.dispatch(actions.closeTab({ tab }));
      }
    }
  });

  watcher.on(actions.closeTabsBelow, async (store, action) => {
    const markerTab = action.payload.tab;
    const { transient } = store.getState().session.navigation.tabs;

    // woo !
    let closing = false;
    for (const tab of transient) {
      if (closing) {
        store.dispatch(actions.closeTab({ tab }));
      } else if (tab === markerTab) {
        // will start closing after this one
        closing = true;
      }
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
        }
      );
    }
    pathSelector(store.getState());
  });
}
