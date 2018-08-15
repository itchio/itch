import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Store, TabWeb } from "common/types";
import { Watcher } from "common/util/watcher";
import { BrowserWindow, BrowserView, webContents } from "electron";
import { mainLogger } from "main/logger";
import { openAppDevTools } from "main/reactors/open-app-devtools";
import { hookWebContentsContextMenu } from "main/reactors/web-contents-context-menu";
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
        logger.debug(`\n`);
        logger.debug(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
        logger.debug(
          `For index ${oldIndex} => ${index}, applying offset ${offset}`
        );
        logger.debug(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n`);
        wc.goToOffset(offset);
      } else {
        const url = Space.fromState(rs, wind, tab).url();
        logger.debug(`\n`);
        logger.debug(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
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
        logger.debug(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n`);
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
    hookWebContentsContextMenu(wc, wind, store);

    if (SHOW_DEVTOOLS) {
      wc.openDevTools({ mode: "detach" });
    }
  });

  wc.on("did-finish-load", () => {
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

  wc.on("page-title-updated" as any, (ev, title: string) => {
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

  let printWebContentsHistory = (previousIndex: number) => {
    if (wc.history.length === 0) {
      logger.debug(`(The webcontents history are empty for some reason)`);
    } else {
      for (let i = 0; i < wc.history.length; i++) {
        let prevMark = i === previousIndex ? "<" : " ";
        let pendMark = i === wc.pendingIndex ? "P" : " ";
        let currMark = i === wc.currentIndex ? ">" : " ";

        logger.debug(`W|${prevMark}${pendMark}${currMark} ${wc.history[i]}`);
      }
    }
  };

  let printStateHistory = () => {
    const space = Space.fromStore(store, wind, tab);
    logger.debug(`---------------------------------`);
    for (let i = 0; i < space.history().length; i++) {
      const page = space.history()[i];
      logger.debug(`S| ${i === space.currentIndex() ? ">" : " "} ${page.url}`);
    }
  };

  let previousState = {
    previousIndex: 0,
    previousHistorySize: 1,
  };

  const commit = (
    event: any,
    url: string, // latest URL
    inPage: boolean, // in-page navigation (HTML5 pushState/popState/replaceState)
    replaceEntry: boolean // previous history entry was replaced
  ) => {
    if (wc.currentIndex < 0) {
      // We get those spurious events after a "clear history & loadURL()"
      // at this point `wc.history.length` is 0 anyway, so it's not like we
      // can figure out much. They're followed by a meaningful event shortly after.
      logger.debug(
        `Ignoring navigation-entry-committed with negative currentIndex`
      );
      return;
    }

    let { previousIndex, previousHistorySize } = previousState;
    previousState = {
      previousIndex: wc.currentIndex,
      previousHistorySize: wc.history.length,
    };

    const space = Space.fromStore(store, wind, tab);
    const stateHistory = space.history();
    const getStateURL = (index: number) => {
      if (index >= 0 && index < stateHistory.length) {
        return stateHistory[index].url;
      }
      // The index passed to this function is sometimes computed
      // from the current index + an offset, so it might be out
      // of bounds.
      // We always use it to find equal URLs,
      // so it's okay to just return undefined in these cases
      return undefined;
    };
    const stateIndex = space.currentIndex();
    const stateURL = getStateURL(stateIndex);

    logger.debug("\n");
    logger.debug(`=================================`);
    logger.debug(`navigation-entry-committed ${url}`);
    logger.debug(
      `currentIndex ${wc.currentIndex} pendingIndex ${
        wc.pendingIndex
      } inPageIndex ${wc.inPageIndex} inPage ${inPage}`
    );

    printWebContentsHistory(previousIndex);
    printStateHistory();

    if (wc.getTitle() !== url && space.label() !== wc.getTitle()) {
      // page-title-updated does not always fire, so a navigation (in-page or not)
      // is a good place to check.
      // we also check that the webContents' title is not its URL, which happens
      // while it's currently loading a page.
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

    // The logic that follows may not make sense to the casual observer.
    // Let's recap our assumptions:
    //   - The Redux state (ie. Space.history(), Space.currentIndex(), etc.)
    //     should always mirror Electron's navigation controller history.
    //   - Navigation can occur in-page (in which case it's important to
    //     call webContents.{goBack,goForward,goToOffset}), or it can be http-level
    //     navigation (in which case Electron's navigation controller restarts the
    //     renderer process anyway - because "just using Chrome's navigation controller"
    //     apparently broke nodeIntegration (which we don't use for BrowserViews anyway...))
    //   - Navigation can be triggered by the itch app (actions.tabGoBack is dispatched, etc.)
    //     or by the webContents (window.history.go(-1), pushState, clicking on a link, etc.)
    //   - We choose not to rely on events like `did-start-navigation` (Electron 3.x+),
    //     `did-navigate`, `did-navigate-in-page` etc. to avoid race conditions

    let offset = wc.currentIndex - previousIndex;
    let sizeOffset = wc.history.length - previousHistorySize;

    if (sizeOffset === 1) {
      logger.debug(`History grew one, offset is ${offset}`);

      if (stateURL === url) {
        logger.debug(`web and state point to same URL, doing nothing`);
      }

      if (offset === 0) {
        logger.debug(`Replacing because offset is 0`);
        didNavigate(url, NavMode.Replace);
        printStateHistory();
        return;
      }

      let currentURL = space.url();
      let previousWebURL = wc.history[wc.currentIndex - 1];
      if (currentURL && previousWebURL !== currentURL) {
        logger.debug(
          `Replacing because previous web url \n${previousWebURL}\n is not current state url \n${currentURL}`
        );
        didNavigate(url, NavMode.Replace);
        printStateHistory();
        return;
      }

      logger.debug(`Assuming regular navigation happened`);
      didNavigate(url, NavMode.Append);
      printStateHistory();
      return;
    }

    if (sizeOffset === 0) {
      logger.debug(`History stayed the same size, offset is ${1}`);
      if (offset === 1) {
        if (stateURL === url) {
          logger.debug(`web and state point to same URL, doing nothing`);
          return;
        }

        if (getStateURL(stateIndex + offset) === url) {
          logger.debug(`If we apply the history offset, the URLs match!`);
          // fallthrough to in-history navigation
        } else {
          logger.debug(`Assuming normal navigation happened`);
          didNavigate(url, NavMode.Append);
          printStateHistory();
          return;
        }
      } else if (offset === 0) {
        if (replaceEntry) {
          const index = space.currentIndex();
          if (inPage) {
            if (getStateURL(index - 1) === url) {
              logger.debug(
                `replaceEntry is true, but inPage & previous is a dupe, ignoring`
              );
              return;
            }

            if (getStateURL(index + 1) === url) {
              logger.debug(
                `replaceEntry is true, but inPage & next is a dupe, ignoring`
              );
              return;
            }
          }

          logger.debug(`Handling it like a replace`);
          didNavigate(url, NavMode.Replace);
          printStateHistory();
          return;
        } else {
          logger.debug(`Not a replace, doing nothing.`);
          return;
        }
      }

      if (stateURL === url) {
        logger.debug(`web and state point to same URL, doing nothing`);
        return;
      }

      let oldIndex = stateIndex;
      let index = oldIndex + offset;
      if (getStateURL(index) === url) {
        logger.debug(
          `Assuming in-history navigation (${oldIndex} => ${index})`
        );
        store.dispatch(
          actions.tabWentToIndex({
            wind,
            tab,
            oldIndex,
            index,
            fromWebContents: true,
          })
        );
        printStateHistory();
        return;
      } else {
        logger.debug(`We're not sure what happened, doing nothing`);
        return;
      }
    }

    logger.debug(`History shrunk ; usually means normal navigation.`);

    if (stateURL === url) {
      logger.debug(`Except the url is already good, nvm!`);
    } else {
      logger.debug(`Assuming normal navigation happened`);
      didNavigate(url, NavMode.Append);
      printStateHistory();
    }
    return;
  };
  wc.on("navigation-entry-commited" as any, commit);
}
