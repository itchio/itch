import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Store, TabWeb } from "common/types";
import { Watcher } from "common/util/watcher";
import { BrowserWindow, BrowserView, webContents } from "electron";
import { mainLogger } from "main/logger";
import { openAppDevTools } from "main/reactors/open-app-devtools";
import createContextMenu from "main/reactors/web-contents-context-menu";
import { partitionForUser } from "common/util/partition-for-user";
import { getNativeWindow, getNativeState } from "main/reactors/winds";
import { isEmpty } from "underscore";
import {
  setBrowserViewFullscreen,
  showBrowserView,
  destroyBrowserView,
  hideBrowserView,
} from "main/reactors/web-contents/browser-view-utils";
import {
  getBrowserView,
  storeBrowserView,
} from "main/reactors/web-contents/browser-view-state";
import { parseWellKnownUrl } from "main/reactors/web-contents/parse-well-known-url";

const logger = mainLogger.child(__filename);

const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1;

export type ExtendedWebContents = Electron.WebContents & {
  history: string[];
  currentIndex: number;
  pendingIndex: number;
  inPageIndex: number;
};

type WebContentsCallback<T> = (wc: ExtendedWebContents) => T;

function withWebContents<T>(
  store: Store,
  wind: string,
  tab: string,
  cb: WebContentsCallback<T>
): T | null {
  const sp = Space.fromStore(store, wind, tab);

  const { webContentsId } = sp.web();
  if (!webContentsId) {
    return null;
  }

  const wc = webContents.fromId(webContentsId);
  if (!wc || wc.isDestroyed()) {
    return null;
  }

  return cb(wc as ExtendedWebContents);
}
export default function(watcher: Watcher) {
  watcher.on(actions.windHtmlFullscreenChanged, async (store, action) => {
    const { wind, htmlFullscreen } = action.payload;

    if (htmlFullscreen) {
      setBrowserViewFullscreen(store, wind);
    }
  });

  watcher.on(actions.tabGotWebContentsMetrics, async (store, action) => {
    const { initialURL, wind, tab, metrics } = action.payload;
    const rs = store.getState();
    const bv = getBrowserView(wind, tab);

    if (bv) {
      const ns = getNativeState(rs, wind);
      if (ns.htmlFullscreen) {
        setBrowserViewFullscreen(store, wind);
      } else {
        bv.setBounds({
          width: metrics.width,
          height: metrics.height,
          x: metrics.left,
          y: metrics.top,
        });
      }
    } else {
      const userId = rs.profile.profile.id;

      const bv = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          partition: partitionForUser(String(userId)),
        },
      });
      storeBrowserView(wind, tab, bv);
      bv.setBounds({
        width: metrics.width,
        height: metrics.height,
        x: metrics.left,
        y: metrics.top,
      });

      showBrowserView(store, wind);

      logger.debug(`Loading url '${initialURL}'`);
      bv.webContents.loadURL(initialURL);

      store.dispatch(
        actions.tabGotWebContents({
          wind,
          tab,
          webContentsId: bv.webContents.id,
        })
      );
    }
  });

  watcher.on(actions.tabGotWebContents, async (store, action) => {
    await hookWebContents(store, action.payload);
  });

  watcher.on(actions.tabLosingWebContents, async (store, action) => {
    const { wind, tab } = action.payload;
    logger.debug(`Tab ${tab} losing web contents!`);

    destroyBrowserView(store, wind, tab);
    store.dispatch(actions.tabLostWebContents({ wind, tab }));
  });

  watcher.on(actions.tabFocused, async (store, action) => {
    const { wind } = action.payload;
    showBrowserView(store, wind);
  });

  watcher.on(actions.openModal, async (store, action) => {
    const { wind } = action.payload;
    hideBrowserView(store, wind);
  });

  watcher.on(actions.modalClosed, async (store, action) => {
    const { wind } = action.payload;
    if (!isEmpty(store.getState().winds[wind].modals)) {
      return;
    }
    showBrowserView(store, wind);
  });

  watcher.on(actions.popupContextMenu, async (store, action) => {
    const { wind } = action.payload;
    hideBrowserView(store, wind);
  });

  watcher.on(actions.closeContextMenu, async (store, action) => {
    const { wind } = action.payload;
    showBrowserView(store, wind);
  });

  watcher.on(actions.analyzePage, async (store, action) => {
    const { wind, tab, url } = action.payload;
    await withWebContents(store, wind, tab, async wc => {
      const onNewPath = (url: string, resource: string) => {
        if (resource) {
          logger.debug(`Got resource ${resource}`);
          store.dispatch(
            actions.evolveTab({
              wind,
              tab,
              url,
              resource,
              replace: true,
              onlyIfMatchingURL: true,
              fromWebContents: true,
            })
          );
        }
      };

      const code = `(document.querySelector('meta[name="itch:path"]') || {}).content`;
      const newPath = await wc.executeJavaScript(code);
      onNewPath(url, newPath);
    });
  });

  watcher.on(actions.tabReloaded, async (store, action) => {
    const { wind, tab } = action.payload;
    withWebContents(store, wind, tab, wc => {
      wc.reload();
    });
  });

  watcher.on(actions.commandStop, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    withWebContents(store, wind, tab, wc => {
      wc.stop();
    });
  });

  watcher.on(actions.commandLocation, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(
      actions.tabDataFetched({
        wind,
        tab,
        data: {
          web: { editingAddress: true },
        },
      })
    );

    const nw = getNativeWindow(store.getState(), wind);
    if (nw && nw.webContents) {
      nw.webContents.focus();
    }
  });

  watcher.on(actions.focusSearch, async (store, action) => {
    const wind = "root";
    const nw = getNativeWindow(store.getState(), wind);
    if (nw && nw.webContents) {
      nw.webContents.focus();
    }
  });

  watcher.on(actions.commandBack, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(
      actions.tabDataFetched({
        wind,
        tab,
        data: {
          web: { editingAddress: false },
        },
      })
    );
  });

  watcher.on(actions.openDevTools, async (store, action) => {
    const { wind, forApp } = action.payload;
    if (forApp) {
      openAppDevTools(BrowserWindow.getFocusedWindow());
    } else {
      const { tab } = store.getState().winds[wind].navigation;
      withWebContents(store, wind, tab, wc => {
        wc.openDevTools({ mode: "bottom" });
      });
    }
  });

  watcher.on(actions.tabGoBack, async (store, action) => {
    const { wind, tab } = action.payload;
    const rs = store.getState();
    const ti = rs.winds[wind].tabInstances[tab];
    if (!ti) {
      return;
    }

    store.dispatch(
      actions.tabGoToIndex({
        wind,
        tab,
        index: ti.currentIndex - 1,
      })
    );
  });

  watcher.on(actions.tabGoForward, async (store, action) => {
    const { wind, tab } = action.payload;
    const rs = store.getState();
    const ti = rs.winds[wind].tabInstances[tab];
    if (!ti) {
      return;
    }

    store.dispatch(
      actions.tabGoToIndex({
        wind,
        tab,
        index: ti.currentIndex + 1,
      })
    );
  });

  watcher.on(actions.tabGoToIndex, async (store, action) => {
    const { wind, tab, index } = action.payload;
    const rs = store.getState();
    const ti = rs.winds[wind].tabInstances[tab];
    if (!ti) {
      return;
    }

    if (index < 0 || index >= ti.history.length) {
      return;
    }

    store.dispatch(
      actions.tabWentToIndex({
        wind,
        tab,
        index,
        oldIndex: ti.currentIndex,
      })
    );
  });

  watcher.on(actions.tabWentToIndex, async (store, action) => {
    const rs = store.getState();
    const { wind, tab, oldIndex, index, fromWebContents } = action.payload;
    if (fromWebContents) {
      return;
    }

    withWebContents(store, wind, tab, wc => {
      let offset = index - oldIndex;
      const url = rs.winds[wind].tabInstances[tab].history[index].url;
      if (
        wc.canGoToOffset(offset) &&
        wc.history[wc.currentIndex + offset] === url
      ) {
        logger.debug(
          `For index ${oldIndex} => ${index}, applying offset ${offset}`
        );
        wc.goToOffset(offset);
      } else {
        const url = Space.fromState(rs, wind, tab).url();
        logger.debug(
          `For index ${oldIndex} => ${index}, clearing history and loading ${url}`
        );
        logger.debug(`(could go to offset? ${wc.canGoToOffset(offset)})`);
        logger.debug(`(wcl = ${wc.history[wc.currentIndex + offset]})`);
        logger.debug(`(url = ${url})`);

        if (offset == 1) {
          logger.debug(
            `Wait, no, we're just going forward one, we don't need to clear history`
          );
        } else {
          wc.clearHistory();
        }
        wc.loadURL(url);
      }
    });
  });

  watcher.on(actions.evolveTab, async (store, action) => {
    const { wind, tab, url, replace, fromWebContents } = action.payload;
    if (replace || fromWebContents) {
      return;
    }

    withWebContents(store, wind, tab, async wc => {
      const webUrl = wc.history[wc.currentIndex];
      if (webUrl !== url) {
        logger.debug(
          `WebContents has\n--> ${webUrl}\ntab evolved to\n--> ${url}\nlet's load`
        );
        wc.loadURL(url);
      } else {
        logger.debug(
          `WebContents has\n--> ${webUrl}\ntab evolved to\n--> ${url}\nwe're good.`
        );
      }
    });
  });
}

async function hookWebContents(
  store: Store,
  payload: typeof actions.tabGotWebContents["payload"]
) {
  const { wind, tab, webContentsId } = payload;
  logger.debug(`Got webContents ${webContentsId} for tab ${tab}`);

  const wc = webContents.fromId(webContentsId) as ExtendedWebContents;
  if (!wc) {
    logger.warn(`Couldn't get webContents for tab ${tab}`);
    return;
  }

  let pushWeb = (web: Partial<TabWeb>) => {
    store.dispatch(
      actions.tabDataFetched({
        wind,
        tab,
        data: {
          web,
        },
      })
    );
  };
  pushWeb({ webContentsId, loading: wc.isLoading() });

  wc.once("did-finish-load", () => {
    logger.debug(`did-finish-load (once)`);
    pushWeb({
      hadFirstLoad: true,
    });
    createContextMenu(wc, wind, store);

    if (SHOW_DEVTOOLS) {
      wc.openDevTools({ mode: "detach" });
    }
  });

  wc.on("did-finish-load", () => {
    logger.debug(
      `did-finish-load (on), executing injected js and analyzing page`
    );
    wc.executeJavaScript(
      `window.__itchInit && window.__itchInit(${JSON.stringify(tab)})`,
      false
    );

    store.dispatch(
      actions.analyzePage({
        wind,
        tab,
        url: wc.getURL(),
      })
    );
  });

  wc.on("did-start-loading", () => {
    pushWeb({ loading: true });
  });

  wc.on("did-stop-loading", () => {
    pushWeb({ loading: false });
  });

  // FIXME: page-title-updated isn't documented, see https://github.com/electron/electron/issues/10040
  // also, with electron@1.7.5, it seems to not always fire. whereas webview's event does.

  wc.on("page-title-updated" as any, (ev, title: string) => {
    logger.debug(`Got page-title-updated! ${title}`);
    store.dispatch(
      actions.tabDataFetched({
        wind,
        tab,
        data: {
          label: title,
        },
      })
    );
  });

  wc.on("page-favicon-updated", (ev, favicons) => {
    pushWeb({ favicon: favicons[0] });
  });

  wc.on(
    "new-window",
    (ev, url, frameName, disposition, options, additionalFeatures) => {
      ev.preventDefault();
      logger.debug(`new-window fired for ${url}, navigating instead`);
      const background = disposition === "background-tab";
      store.dispatch(actions.navigate({ url, wind, background }));
    }
  );

  enum NavMode {
    Append,
    Replace,
  }

  const didNavigate = (url: string, navMode?: NavMode) => {
    let resource = null;
    const result = parseWellKnownUrl(url);
    if (result) {
      url = result.url;
      resource = result.resource;
      logger.debug(`Parsed well-known url: ${url} => ${resource}`);
    }

    store.dispatch(
      actions.evolveTab({
        wind,
        tab,
        url,
        resource,
        replace: navMode === NavMode.Replace,
        fromWebContents: true,
      })
    );
  };

  let previousState = {
    previousIndex: -1,
    previousHistorySize: 0,
  };

  const commit = (
    event: any,
    url: string,
    inPage: boolean,
    replaceEntry: boolean
  ) => {
    let { previousIndex, previousHistorySize } = previousState;
    previousState = {
      previousIndex: wc.currentIndex,
      previousHistorySize: wc.history.length,
    };

    const space = Space.fromStore(store, wind, tab);

    logger.debug(``);
    logger.debug(``);
    logger.debug(`=================================`);
    logger.debug(
      `currentIndex ${wc.currentIndex} inPageIndex ${
        wc.inPageIndex
      } inPage ${inPage}`
    );
    if (wc.history.length === 0) {
      logger.debug(`(The webcontents history are empty for some reason)`);
    } else {
      for (let i = 0; i < wc.history.length; i++) {
        logger.debug(
          `W|${i === previousIndex ? "<" : " "}${
            i === wc.currentIndex ? ">" : " "
          } ${wc.history[i]}`
        );
      }
    }

    let printStateHistory = () => {
      const space = Space.fromStore(store, wind, tab);
      logger.debug(`---------------------------------`);
      for (let i = 0; i < space.history().length; i++) {
        const page = space.history()[i];
        logger.debug(
          `S| ${i === space.currentIndex() ? ">" : " "} ${page.url}`
        );
      }
    };
    printStateHistory();

    if (wc.getTitle() !== url && space.label() !== wc.getTitle()) {
      store.dispatch(
        actions.tabDataFetched({
          wind,
          tab,
          data: {
            label: wc.getTitle(),
          },
        })
      );
    }

    let offset = wc.currentIndex - previousIndex;
    let sizeOffset = wc.history.length - previousHistorySize;

    if (sizeOffset === 1) {
      logger.debug(
        `==> History grew one, we navigated to a new page (offset = ${offset})`
      );

      if (wc.history.length === 1) {
        logger.debug(`==> Replacing because only history item`);
        didNavigate(url, NavMode.Replace);
        printStateHistory();
        return;
      }

      if (offset === 0) {
        logger.debug(`==> Replacing because offset is 0`);
        didNavigate(url, NavMode.Replace);
        printStateHistory();
        return;
      }

      const sp = Space.fromStore(store, wind, tab);
      let previousStatePage = sp.history()[sp.currentIndex()];
      let previousWebURL = wc.history[wc.currentIndex - 1];
      if (previousStatePage && previousWebURL !== previousStatePage.url) {
        logger.debug(
          `==> Replacing because previous web url \n${previousWebURL}\n is not current state url \n${
            previousStatePage.url
          }`
        );
        didNavigate(url, NavMode.Replace);
        printStateHistory();
        return;
      }

      didNavigate(url, NavMode.Append);
      printStateHistory();
      return;
    }

    if (sizeOffset === 0) {
      logger.debug(`==> History stayed the same, offset = ${offset}`);
      if (offset === 1) {
        logger.debug(`Went forward one, eh, is it an append?`);

        const his = space.history();
        let index = space.currentIndex() + offset;
        if (his[space.currentIndex()].url === url) {
          logger.debug(`The URLs match without any offset, nevermind that!`);
          return;
        } else if (index >= 0 && index < his.length && his[index].url === url) {
          logger.debug(`If we apply the history offset, the URLs match`);
          // fallthrough
        } else {
          logger.debug(`Why yes it is an append`);
          didNavigate(url, NavMode.Append);
          printStateHistory();
          return;
        }
      } else if (offset === 0) {
        if (replaceEntry) {
          logger.debug(`Chrome tells us it's a replace!`);
          if (inPage) {
            logger.debug(`But it's inPage? So let's ignore it?`);
          } else if (space.history()[space.currentIndex() - 1].url === url) {
            logger.debug(
              `But the previous url is also ${url}, so let's just ignore that.`
            );
          } else {
            didNavigate(url, NavMode.Replace);
          }
          printStateHistory();
          return;
        } else {
          logger.debug(
            `So.. the history size didn't change, the offset is 0, and chrome tells us it's not a replace..`
          );
          logger.debug(`Doing nothing!`);
          return;
        }
      }

      let oldIndex = space.currentIndex();
      let index = oldIndex + offset;
      logger.debug(`Assuming in-history navigation (${oldIndex} => ${index})`);
      const his = space.history();
      if (index >= 0 && index < his.length && his[index].url === url) {
        logger.debug(`The URLs do match!`);
        store.dispatch(
          actions.tabWentToIndex({
            wind,
            tab,
            oldIndex,
            index,
            fromWebContents: true,
          })
        );
      } else {
        logger.debug(`Nope, the URLs don't match, nvm`);
      }
      printStateHistory();
      return;
    }

    logger.debug(
      `So, the history shrunk. That means it must be a normal navigation.`
    );
    if (inPage) {
      logger.debug(`Except it's in-page so nevermind.`);
    } else {
      didNavigate(url, NavMode.Append);
      printStateHistory();
    }
    return;
  };
  wc.on("navigation-entry-commited" as any, commit);
}
