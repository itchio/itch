import { actions } from "common/actions";
import { opensInWindow } from "common/constants/windows";
import { Space } from "common/helpers/space";
import { RootState, MenuTemplate } from "common/types";
import uuid from "common/util/uuid";
import { Watcher } from "common/util/watcher";
import { shell } from "electron";
import { mainLogger } from "main/logger";
import { getNativeWindow } from "main/reactors/winds";
import { createSelector } from "reselect";
import { truncate } from "common/format/truncate";

const logger = mainLogger.child(__filename);

let shownHistoryItems = 12;

export default function(watcher: Watcher) {
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
      if (
        nativeWindow &&
        nativeWindow.isFocused() &&
        !background &&
        url !== "itch://new-tab"
      ) {
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

interface MenuTemplateOpts {
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
  const { wind, space, startIndex, endIndex } = opts;
  const tab = space.tab;
  const history = space.history();
  const currentIndex = space.currentIndex();

  let processItem = (i: number) => {
    template.push({
      localizedLabel: truncate(history[i].url, { length: 50 }),
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
