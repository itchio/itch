import { actions } from "common/actions";
import { ITCH_URL_RE } from "common/constants/urls";
import { Space } from "common/helpers/space";
import { Store, TabPage } from "common/types";
import { Watcher } from "common/util/watcher";
import { BrowserWindow, WebContents, webContents } from "electron";
import { mainLogger } from "main/logger";
import { openAppDevTools } from "main/reactors/open-app-devtools";
import { hookWebContentsContextMenu } from "main/reactors/web-contents-context-menu";
import { parseWellKnownUrl } from "main/reactors/web-contents/parse-well-known-url";
import {
  forgetWebContents,
  getWebContents,
  storeWebContents,
} from "main/reactors/web-contents/web-contents-state";
import { getNativeWindow } from "main/reactors/winds";

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
  const wc = getWebContents(wind, tab);
  if (wc && !wc.isDestroyed()) {
    return cb(wc as ExtendedWebContents);
  }
  return null;
}

function loadURL(wc: WebContents, url: string) {
  if (ITCH_URL_RE.test(url)) {
    return;
  }
  wc.loadURL(url);
}

export default function (watcher: Watcher) {
  watcher.on(actions.windHtmlFullscreenChanged, async (store, action) => {
    const { wind, htmlFullscreen } = action.payload;

    if (htmlFullscreen) {
      logger.warn(`fullscreen: reimplement`);
    }
  });

  watcher.on(actions.tabGotWebContents, async (store, action) => {
    const { wind, tab, webContentsId } = action.payload;
    const rs = store.getState();
    const initialURL = rs.winds[wind].tabInstances[tab].location.url;

    const wc = webContents.fromId(webContentsId);
    storeWebContents(wind, tab, wc);

    logger.debug(`Loading url '${initialURL}'`);
    await hookWebContents(store, wind, tab, wc as ExtendedWebContents);
    loadURL(wc, initialURL);
  });

  watcher.on(actions.tabLosingWebContents, async (store, action) => {
    const { wind, tab } = action.payload;
    logger.debug(`Tab ${tab} losing web contents!`);

    forgetWebContents(wind, tab);
  });

  watcher.on(actions.analyzePage, async (store, action) => {
    const { wind, tab, url } = action.payload;
    await withWebContents(store, wind, tab, async (wc) => {
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
    withWebContents(store, wind, tab, (wc) => {
      wc.reload();
    });
  });

  watcher.on(actions.commandStop, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    withWebContents(store, wind, tab, (wc) => {
      wc.stop();
    });
  });

  watcher.on(actions.commandLocation, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
    store.dispatch(
      actions.focusLocationBar({
        wind,
        tab,
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
    store.dispatch(actions.blurLocationBar({}));
  });

  watcher.on(actions.openDevTools, async (store, action) => {
    const { wind, tab } = action.payload;
    if (tab) {
      const { tab } = store.getState().winds[wind].navigation;
      withWebContents(store, wind, tab, (wc) => {
        wc.openDevTools({ mode: "detach" });
      });
    } else {
      openAppDevTools(BrowserWindow.getFocusedWindow());
    }
  });

  watcher.on(actions.inspect, async (store, action) => {
    const { webContentsId, x, y } = action.payload;
    const wc = webContents.fromId(webContentsId);
    if (wc && !wc.isDestroyed()) {
      const dwc = wc.devToolsWebContents;
      if (dwc) {
        wc.devToolsWebContents.focus();
      } else {
        wc.openDevTools({ mode: "detach" });
      }
      wc.inspectElement(x, y);
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

    withWebContents(store, wind, tab, (wc) => {
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
        loadURL(wc, url);
      }
    });
  });

  watcher.on(actions.evolveTab, async (store, action) => {
    const { wind, tab, url, replace, fromWebContents } = action.payload;
    if (replace || fromWebContents) {
      return;
    }

    withWebContents(store, wind, tab, async (wc) => {
      const webUrl = wc.history[wc.currentIndex];
      if (webUrl !== url) {
        logger.debug(
          `WebContents has\n--> ${webUrl}\ntab evolved to\n--> ${url}\nlet's load`
        );
        loadURL(wc, url);
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
  wind: string,
  tab: string,
  wc: ExtendedWebContents
) {
  let setLoading = (loading: boolean) => {
    store.dispatch(actions.tabLoadingStateChanged({ wind, tab, loading }));
  };
  let pushPageUpdate = (page: Partial<TabPage>) => {
    store.dispatch(
      actions.tabPageUpdate({
        wind,
        tab,
        page,
      })
    );
  };
  setLoading(wc.isLoading());

  wc.on("certificate-error", (ev, url, error, certificate, cb) => {
    cb(false);
    logger.warn(
      `Certificate error ${error} for ${url}, issued by ${certificate.issuerName} for ${certificate.subjectName}`
    );
  });

  wc.on(
    "did-fail-load",
    (ev, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) {
        return;
      }
      logger.warn(
        `Did fail load: ${errorCode}, ${errorDescription} for ${validatedURL}`
      );
    }
  );

  wc.once("did-finish-load", () => {
    logger.debug(`did-finish-load (once)`);
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
    setLoading(true);
  });

  wc.on("did-stop-loading", () => {
    setLoading(false);
  });

  wc.on("page-title-updated" as any, (ev, title: string) => {
    pushPageUpdate({
      label: title,
    });
  });

  wc.on("page-favicon-updated", (ev, favicons) => {
    pushPageUpdate({
      favicon: favicons[0],
    });
  });

  wc.on(
    "new-window",
    (ev, url, frameName, disposition, options, additionalFeatures) => {
      ev.preventDefault();
      logger.debug(`new-window fired for ${url}`);
      wc.loadURL(url);
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
        label: wc.getTitle(),
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
      logger.debug("WebContents history:");
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
    logger.debug("State history:");
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
    reason: "will-navigate" | "did-navigate" | "did-navigate-in-page",
    event: any,
    url: string, // latest URL
    inPage: boolean, // in-page navigation (HTML5 pushState/popState/replaceState)
    replaceEntry: boolean // previous history entry was replaced
  ) => {
    if (wc.currentIndex < 0) {
      // We get those spurious events after a "clear history & loadURL()"
      // at this point `wc.history.length` is 0 anyway, so it's not like we
      // can figure out much. They're followed by a meaningful event shortly after.
      logger.debug(`Ignoring commit with negative currentIndex`);
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
    logger.debug(`commit ${url}, reason ${reason}`);
    logger.debug(
      `currentIndex ${wc.currentIndex} pendingIndex ${wc.pendingIndex} inPageIndex ${wc.inPageIndex} inPage ${inPage}`
    );

    printWebContentsHistory(previousIndex);
    printStateHistory();

    const wcTitle = wc.getTitle();
    if (
      wcTitle !== url &&
      space.label() !== wc.getTitle() &&
      !/^itch:/i.test(url)
    ) {
      // page-title-updated does not always fire, so a navigation (in-page or not)
      // is a good place to check.
      // we also check that the webContents' title is not its URL, which happens
      // while it's currently loading a page.
      logger.debug(`pushing webContents title ${wcTitle}`);
      pushPageUpdate({
        url,
        label: wcTitle,
      });
    }

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
      logger.debug(`History stayed the same size, offset is ${offset}`);
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
          const index = space.currentIndex();
          let prevURL = getStateURL(index - 1);
          let webURL = wc.history[wc.currentIndex];
          logger.debug(`prevURL = ${prevURL}`);
          logger.debug(` webURL = ${webURL}`);
          if (prevURL === webURL) {
            logger.debug(
              `looks like a forward navigation, but previous is a dupe`
            );
            didNavigate(url, NavMode.Replace);
            return;
          } else {
            logger.debug(`Not a replace, doing nothing.`);
            return;
          }
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
  wc.on("did-navigate", (event, url) => {
    commit("did-navigate", event, url, false, false);
  });
  wc.on("did-navigate-in-page", (event, url) => {
    commit("did-navigate-in-page", event, url, true, false);
  });
}
