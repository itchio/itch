import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Store, TabWeb } from "common/types";
import { Watcher } from "common/util/watcher";
import { BrowserWindow, BrowserView, webContents } from "electron";
import { mainLogger } from "main/logger";
import nodeURL from "url";
import { openAppDevTools } from "main/reactors/open-app-devtools";
import createContextMenu from "main/reactors/web-contents-context-menu";
import { partitionForUser } from "common/util/partition-for-user";
import { getNativeWindow, getNativeState } from "main/reactors/winds";
import { isEmpty } from "underscore";

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
  window: string,
  tab: string,
  cb: WebContentsCallback<T>
): T | null {
  const sp = Space.fromStore(store, window, tab);

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

async function hideBrowserView(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);
  nw.setBrowserView(null);
}

async function showBrowserView(store: Store, wind: string) {
  const rs = store.getState();
  const ws = rs.winds[wind];
  if (!isEmpty(ws.modals)) {
    // don't show browser view again as long as there are modals
    return;
  }
  if (ws.contextMenu && ws.contextMenu.open) {
    // don't show browser view again as long as there are context menus
    return;
  }

  const { tab } = ws.navigation;
  const bv = getBrowserView(wind, tab);
  if (bv) {
    const nw = getNativeWindow(rs, wind);
    nw.setBrowserView(bv);
  }
}

function setBrowserViewFullscreen(store: Store, wind: string) {
  const rs = store.getState();
  const nw = getNativeWindow(rs, wind);
  const bv = nw.getBrowserView();

  const bounds = nw.getContentBounds();
  bv.setBounds({
    width: bounds.width,
    height: bounds.height,
    x: 0,
    y: 0,
  });
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
      setBrowserView(wind, tab, bv);
      bv.setBounds({
        width: metrics.width,
        height: metrics.height,
        x: metrics.left,
        y: metrics.top,
      });

      const nw = getNativeWindow(rs, wind);
      nw.setBrowserView(bv);

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
    const { wind, tab, webContentsId } = action.payload;
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

    const didNavigate = (url: string, replace?: boolean) => {
      if (url !== "about:blank") {
        let resource = null;
        const result = parseWellKnownUrl(url);
        if (result) {
          url = result.url;
          resource = result.resource;
          console.log(`Caught well-known url: `, result);
        }

        store.dispatch(
          actions.evolveTab({
            wind,
            tab,
            url,
            resource,
            replace,
          })
        );
      }
    };

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
        const background = disposition === "background-tab";
        store.dispatch(actions.navigate({ url, wind, background }));
      }
    );

    wc.on(
      "navigation-entry-commited" as any,
      (event: any, url: string, inPage: boolean, replaceEntry: boolean) => {
        logger.debug(`=================================`);
        logger.debug(
          `navigation entry committed: ${url}, inPage = ${inPage}, replaceEntry = ${replaceEntry}`
        );
        logger.debug(`history is now: ${JSON.stringify(wc.history, null, 2)}`);
        logger.debug(`currentIndex: ${wc.currentIndex}`);
        logger.debug(`inPageIndex: ${wc.inPageIndex}`);
        didNavigate(url, replaceEntry);
        logger.debug(`=================================`);
      }
    );
  });

  watcher.on(actions.tabLosingWebContents, async (store, action) => {
    const { wind, tab } = action.payload;
    logger.debug(`Tab ${tab} losing web contents!`);

    const rs = store.getState();
    const nw = getNativeWindow(rs, wind);
    nw.setBrowserView(null);

    const bv = getBrowserView(wind, tab);
    if (bv) {
      bv.destroy();
      forgetBrowserView(wind, tab);
    }
  });

  watcher.on(actions.focusTab, async (store, action) => {
    const { wind, tab } = action.payload;
    const rs = store.getState();
    const nw = getNativeWindow(rs, wind);
    const bv = getBrowserView(wind, tab);
    if (!bv) {
      logger.debug(`Switching to tab without browser view.`);
      nw.setBrowserView(null);
    } else {
      logger.debug(
        `Switching to tab with browser view. Destroyed? ${bv.isDestroyed()}`
      );
      if (bv.webContents) {
        logger.debug(`Webcontents destroyed? ${bv.webContents.isDestroyed()}`);
      } else {
        logger.debug(`nil webcontents! ${bv.webContents}`);
      }
      nw.setBrowserView(bv);
    }
  });

  watcher.on(actions.tabChanged, async (store, action) => {
    const { wind, tab } = action.payload;
    const rs = store.getState();
    const nw = getNativeWindow(rs, wind);
    const bv = getBrowserView(wind, tab);
    if (!bv) {
      logger.debug(`Switching to tab without browser view.`);
      nw.setBrowserView(null);
    } else {
      logger.debug(
        `Switching to tab with browser view. Destroyed? ${bv.isDestroyed()}`
      );
      nw.setBrowserView(bv);
    }
  });

  watcher.on(actions.openModal, async (store, action) => {
    const { wind } = action.payload;
    await hideBrowserView(store, wind);
  });

  watcher.on(actions.modalClosed, async (store, action) => {
    const { wind } = action.payload;
    if (!isEmpty(store.getState().winds[wind].modals)) {
      return;
    }
    await showBrowserView(store, wind);
  });

  watcher.on(actions.popupContextMenu, async (store, action) => {
    const { wind } = action.payload;
    await hideBrowserView(store, wind);
  });

  watcher.on(actions.closeContextMenu, async (store, action) => {
    const { wind } = action.payload;
    await showBrowserView(store, wind);
  });

  watcher.on(actions.analyzePage, async (store, action) => {
    const { wind, tab, url } = action.payload;
    await withWebContents(store, wind, tab, async wc => {
      const onNewPath = (url: string, resource: string) => {
        if (resource) {
          // FIXME: we need this to be better - analyze can finish after we've already navigated away
          // so we need to only set resource if the url is what we think it is
          logger.debug(`Got resource ${resource}`);
          store.dispatch(
            actions.evolveTab({
              wind,
              tab,
              url,
              resource,
              replace: true,
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
      await openAppDevTools(BrowserWindow.getFocusedWindow());
    } else {
      const { tab } = store.getState().winds[wind].navigation;
      withWebContents(store, wind, tab, wc => {
        wc.openDevTools({ mode: "bottom" });
      });
    }
  });
}

const COLLECTION_URL_RE = /^\/c\/([0-9]+)/;
const DOWNLOAD_URL_RE = /^.*\/download\/[a-zA-Z0-9]*$/;

interface WellKnownUrlResult {
  resource: string;
  url: string;
}

function parseWellKnownUrl(url: string): WellKnownUrlResult {
  try {
    const u = nodeURL.parse(url);
    if (u.hostname === "itch.io") {
      const collMatches = COLLECTION_URL_RE.exec(u.pathname);
      if (collMatches) {
        return {
          resource: `collections/${collMatches[1]}`,
          url,
        };
      }
    } else if (u.hostname.endsWith(".itch.io")) {
      const dlMatches = DOWNLOAD_URL_RE.exec(u.pathname);
      if (dlMatches) {
        let gameUrl = url.replace(/\/download.*$/, "");
        return {
          resource: null,
          url: gameUrl,
        };
      }
    }
  } catch (e) {
    logger.warn(`Could not parse url: ${url}`);
  }

  return null;
}

/**
 *
 */

const browserViews: {
  [wind: string]: {
    [tab: string]: BrowserView;
  };
} = {};

function setBrowserView(wind: string, tab: string, bv: BrowserView) {
  if (!(wind in browserViews)) {
    browserViews[wind] = {};
  }
  browserViews[wind][tab] = bv;
}

function getBrowserView(wind: string, tab: string): BrowserView | null {
  if (!(wind in browserViews)) {
    return null;
  }
  return browserViews[wind][tab];
}

function forgetBrowserView(wind: string, tab: string) {
  if (!(wind in browserViews)) {
    return;
  }
  delete browserViews[wind][tab];
}
