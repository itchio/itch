import { actions } from "../actions";
import { Watcher } from "./watcher";

import staticTabData from "../constants/static-tab-data";

import { createSelector } from "reselect";
import { contains } from "underscore";

import { IRootState } from "../types";

import rootLogger from "../logger";
import { Space } from "../helpers/space";
import { shell } from "electron";
import {
  collectionToTabData,
  gameToTabData,
  userToTabData,
} from "../util/navigation";
import uuid from "../util/uuid";
const logger = rootLogger.child({ name: "reactors/navigation" });

export default function(watcher: Watcher) {
  watcher.on(actions.navigateToCollection, async (store, action) => {
    const { collection, background } = action.payload;
    store.dispatch(
      actions.navigate({
        tab: `collections/${collection.id}`,
        data: collectionToTabData(collection),
        background,
      })
    );
  });

  watcher.on(actions.navigateToGame, async (store, action) => {
    const { game, background } = action.payload;
    store.dispatch(
      actions.navigate({
        tab: `games/${game.id}`,
        data: gameToTabData(game),
        background,
      })
    );
  });

  watcher.on(actions.navigateToUser, async (store, action) => {
    const { user, background } = action.payload;
    store.dispatch(
      actions.navigate({
        tab: `users/${user.id}`,
        data: userToTabData(user),
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

  watcher.on(actions.navigate, async (store, action) => {
    const rs = store.getState();
    const { tab, background } = action.payload;
    logger.debug(`Navigating to ${tab} ${background ? "(in background)" : ""}`);

    const sp = Space.fromData({ path: tab });
    if (sp.prefix === "url" && /mailto:/.test(sp.suffix)) {
      logger.debug(`Is mailto link, opening as external and skipping tab open`);
      shell.openExternal(sp.suffix);
      return;
    }

    const { tabData } = rs.session;

    const { tabs } = rs.session.navigation;
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
        actions.openTab({
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
          tab: uuid(),
          background,
          data: {
            path: tab,
            ...data,
          },
        })
      );
    }
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

  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.session.navigation.tab,
        tab => schedule.dispatch(actions.tabChanged({ tab }))
      ),
  });

  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.session.navigation.tabs,
        (rs: IRootState) => rs.session.tabData,
        (rs: IRootState) => rs.session.navigation.tab,
        (tabs, tabData, tab) => schedule.dispatch(actions.tabsChanged({}))
      ),
  });
}
