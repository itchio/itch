import { actions } from "common/actions";
import { opensInWindow } from "common/constants/windows";
import { t } from "common/format/t";
import { truncate } from "common/format/truncate";
import { Space } from "common/helpers/space";
import { I18nState, MenuTemplate, RootState } from "common/types";
import uuid from "common/util/uuid";
import { Watcher } from "common/util/watcher";
import { shell } from "electron";
import { mainLogger } from "main/logger";
import { getNativeWindow } from "main/reactors/winds";
import { createSelector } from "reselect";

const logger = mainLogger.child(__filename);

let shownHistoryItems = 12;

export default function (watcher: Watcher) {
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

  watcher.on(actions.openTabBackHistory, async (store, action) => {
    const { wind, tab, clientX, clientY } = action.payload;
    const space = Space.fromStore(store, wind, tab);
    if (!space.canGoBack()) {
      return;
    }

    let startIndex = 0;
    let endIndex = space.currentIndex();
    if (endIndex - startIndex > shownHistoryItems) {
      startIndex = endIndex - shownHistoryItems;
    }

    const template = makeHistoryTemplate({
      i18n: store.getState().i18n,
      wind,
      space,
      startIndex,
      endIndex,
      dir: -1,
    });
    store.dispatch(
      actions.popupContextMenu({ wind, clientX, clientY, template })
    );
  });

  watcher.on(actions.openTabForwardHistory, async (store, action) => {
    const { wind, tab, clientX, clientY } = action.payload;
    const space = Space.fromStore(store, wind, tab);
    if (!space.canGoForward()) {
      return;
    }

    let startIndex = space.currentIndex() + 1;
    let endIndex = space.history().length;
    if (endIndex - startIndex > shownHistoryItems) {
      endIndex = startIndex + shownHistoryItems;
    }

    const template = makeHistoryTemplate({
      i18n: store.getState().i18n,
      wind,
      space,
      startIndex,
      endIndex,
      dir: 1,
    });
    store.dispatch(
      actions.popupContextMenu({ wind, clientX, clientY, template })
    );
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
    let { url, resource, wind, background, replace } = action.payload;
    logger.debug(`Navigating to ${url} ${background ? "(in background)" : ""}`);

    if (opensInWindow(url)) {
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
    });
    if (space.protocol() == "mailto:") {
      logger.debug(`Is mailto link, opening as external and skipping tab open`);
      shell.openExternal(space.suffix);
      return;
    }

    const rs = store.getState();
    if (hasMultipleTabs(rs, wind)) {
      const nativeWindow = getNativeWindow(rs, "root");
      if (
        nativeWindow &&
        nativeWindow.isFocused() &&
        !background &&
        url !== "itch://new-tab"
      ) {
        // let it navigate the open tab
      } else {
        // open a new tab!
        const tab = uuid();
        store.dispatch(
          actions.tabOpened({
            wind,
            tab,
            url,
            resource,
            background,
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
          resource,
        })
      );
      store.dispatch(
        actions.focusWind({
          wind,
        })
      );
    }
  });

  watcher.on(actions.closeTab, async (store, action) => {
    const { wind, tab } = action.payload;
    const rs = store.getState();
    if (!hasMultipleTabs(rs, wind)) {
      return;
    }

    let andFocus: string = null;

    const nav = rs.winds[wind].navigation;
    if (nav.openTabs.length === 1) {
      logger.debug(`Closing last tab, replacing it with a new-tab`);
      store.dispatch(actions.closeAllTabs({ wind }));
      return;
    }

    if (nav.tab === tab) {
      let tabIndex = nav.openTabs.indexOf(tab);
      if (tabIndex === -1) {
        logger.error(
          `${tab} is not in the set of open tabs ${JSON.stringify(
            nav.openTabs
          )}`
        );
        return;
      }

      if (tabIndex + 1 < nav.openTabs.length) {
        andFocus = nav.openTabs[tabIndex + 1];
      } else if (tabIndex - 1 >= 0) {
        andFocus = nav.openTabs[tabIndex - 1];
      } else {
        logger.error(
          `Can't figure out which other tab to focus from ${JSON.stringify(
            nav.openTabs
          )} after closing ${tab}`
        );
        return;
      }
    }

    store.dispatch(
      actions.tabsClosed({
        wind,
        tabs: [tab],
        andFocus,
      })
    );
  });

  watcher.on(actions.closeAllTabs, async (store, action) => {
    const { wind } = action.payload;
    const rs = store.getState();
    if (!hasMultipleTabs(rs, wind)) {
      return;
    }

    const { openTabs } = rs.winds[wind].navigation;
    const tab = uuid();
    store.dispatch(
      actions.tabOpened({
        wind,
        url: "itch://new-tab",
        tab,
      })
    );
    store.dispatch(
      actions.tabsClosed({
        wind,
        tabs: openTabs,
        andFocus: tab,
      })
    );
  });

  watcher.on(actions.tabsClosed, async (store, action) => {
    const { wind, andFocus } = action.payload;
    if (andFocus) {
      store.dispatch(
        actions.tabFocused({
          wind,
          tab: andFocus,
        })
      );
    }
  });

  watcher.on(actions.tabOpened, async (store, action) => {
    const { wind, tab, background } = action.payload;
    if (!background) {
      store.dispatch(
        actions.tabFocused({
          wind,
          tab,
        })
      );

      const rs = store.getState();
      const nw = getNativeWindow(rs, wind);
      if (nw && nw.webContents) {
        nw.webContents.focus();
      }
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
          (tab) => schedule.dispatch(actions.tabChanged({ wind, tab }))
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

interface MenuTemplateOpts {
  i18n: I18nState;
  wind: string;
  space: Space;
  /** first history item to show, inclusive */
  startIndex: number;
  /** last history item to show, exclusive */
  endIndex: number;
  /** 1 if going forward (for forward history), -1 if going back (for back history!) */
  dir: number;
}

function makeHistoryTemplate(opts: MenuTemplateOpts): MenuTemplate {
  const { i18n, wind, space, startIndex, endIndex } = opts;
  const tab = space.tab;
  const history = space.history();
  const currentIndex = space.currentIndex();

  let processItem = (i: number) => {
    let item = history[i];
    let label = item.label ? t(i18n, item.label) : item.url;
    template.push({
      localizedLabel: truncate(label, { length: 50 }),
      checked: i === currentIndex,
      action: actions.tabGoToIndex({ wind, tab, index: i }),
    });
  };

  let template: MenuTemplate = [];
  if (opts.dir > 0) {
    for (let i = startIndex; i < endIndex; i++) {
      processItem(i);
    }
  } else {
    for (let i = endIndex - 1; i >= startIndex; i--) {
      processItem(i);
    }
  }
  return template;
}

function hasMultipleTabs(rs: RootState, wind: string): boolean {
  return rs.preferences.enableTabs && wind === "root";
}
