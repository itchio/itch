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
  userToTabData,
  gameEvolvePayload,
  collectionEvolvePayload,
} from "../util/navigation";
import uuid from "../util/uuid";
const logger = rootLogger.child({ name: "reactors/navigation" });

import * as nodeURL from "url";
import * as querystring from "querystring";

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
    const { user, background } = action.payload;
    store.dispatch(
      actions.navigate({
        url: `itch://users/${user.id}`,
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

  watcher.on(actions.commandGoBack, async (store, action) => {
    const { tab } = store.getState().profile.navigation;
    store.dispatch(actions.tabGoBack({ tab }));
  });

  watcher.on(actions.commandGoForward, async (store, action) => {
    const { tab } = store.getState().profile.navigation;
    store.dispatch(actions.tabGoForward({ tab }));
  });

  watcher.on(actions.commandReload, async (store, action) => {
    const { tab } = store.getState().profile.navigation;
    store.dispatch(actions.tabReloaded({ tab }));
  });

  watcher.on(actions.navigateTab, async (store, action) => {
    const { background, tab } = action.payload;
    const sp = Space.fromStore(store, tab);

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
    const { url, resource, data, background } = action.payload;
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

    const { openTabs } = rs.profile.navigation;
    const constantTabs = new Set(openTabs.constant);
    const transientTabs = new Set(openTabs.transient);

    if (constantTabs.has(url) || transientTabs.has(url)) {
      // switching to constant or transient tab by url, that's good
      if (!background) {
        store.dispatch(actions.focusTab({ tab: url }));
      }
      return;
    }

    const staticData = staticTabData[url];

    // must be a new tab then!
    if (staticData) {
      store.dispatch(
        actions.openTab({
          tab: url,
          url,
          background,
        })
      );
    } else {
      store.dispatch(
        actions.openTab({
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
    let { tab, params } = action.payload;
    const sp = Space.fromStore(store, tab);

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
        tab,
        url: newURL,
        replace: true,
      })
    );
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { transient } = store.getState().profile.navigation.openTabs;

    // woo !
    for (const tab of transient) {
      store.dispatch(actions.closeTab({ tab }));
    }
  });

  watcher.on(actions.closeOtherTabs, async (store, action) => {
    const safeTab = action.payload.tab;
    const { transient } = store.getState().profile.navigation.openTabs;

    // woo !
    for (const tab of transient) {
      if (tab !== safeTab) {
        store.dispatch(actions.closeTab({ tab }));
      }
    }
  });

  watcher.on(actions.closeTabsBelow, async (store, action) => {
    const markerTab = action.payload.tab;
    const { transient } = store.getState().profile.navigation.openTabs;

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
    const { openTabs, tab } = store.getState().profile.navigation;
    const { transient } = openTabs;

    if (contains(transient, tab)) {
      store.dispatch(actions.closeTab({ tab }));
    }
  });

  watcher.on(actions.downloadStarted, async (store, action) => {
    store.dispatch(
      actions.navigate({ url: "itch://downloads", background: true })
    );
  });

  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.profile.navigation.tab,
        tab => schedule.dispatch(actions.tabChanged({ tab }))
      ),
  });

  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.profile.navigation.openTabs,
        (rs: IRootState) => rs.profile.tabInstances,
        (rs: IRootState) => rs.profile.navigation.tab,
        (openTabs, tabInstances, tab) =>
          schedule.dispatch(actions.tabsChanged({}))
      ),
  });
}
