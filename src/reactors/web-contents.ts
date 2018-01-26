import * as actions from "../actions";
import { Watcher } from "./watcher";

import { webContents, BrowserWindow } from "electron";

import staticTabData from "../constants/static-tab-data";

import urlParser from "../util/url";

import rootLogger from "../logger";
import { request } from "../net/request";
import { IStore } from "../types/index";
const logger = rootLogger.child({ name: "web-contents" });

import createContextMenu from "./web-contents-context-menu";
import { ITabWeb } from "../types/tab-data";
import { DB } from "../db/index";
import { doSave } from "./navigation/save-password-and-secret";

const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1;
const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === "1";

function isFrozen(tab: string): boolean {
  return !!staticTabData[tab];
}

function withWebContents(
  store: IStore,
  tab: string,
  cb: (wc: Electron.WebContents) => any
) {
  const data = store.getState().session.tabData[tab];
  if (!data) {
    return;
  }

  const { web } = data;
  if (!web) {
    return;
  }

  const { webContentsId } = web;
  if (!webContentsId) {
    return;
  }

  const wc = webContents.fromId(webContentsId);
  if (!wc || wc.isDestroyed()) {
    return;
  }

  cb(wc);
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.tabGotWebContents, async (store, action) => {
    const { tab, webContentsId } = action.payload;
    logger.debug(`Got webContents ${webContentsId} for tab ${tab}`);

    const wc = webContents.fromId(webContentsId);
    if (!wc) {
      logger.warn(`Couldn't get webContents for tab ${tab}`);
      return;
    }

    let pushWeb = (web: Partial<ITabWeb>) => {
      store.dispatch(
        actions.tabDataFetched({
          tab,
          data: {
            web,
          },
        })
      );
    };
    pushWeb({ webContentsId, loading: wc.isLoading() });

    const didNavigate = url => {
      pushWeb({
        url,
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward(),
      });
    };

    didNavigate(wc.getURL());

    if (isFrozen(tab)) {
      wc.on("will-navigate", (ev, url) => {
        ev.preventDefault();
        store.dispatch(actions.navigate({ tab: `url/${url}` }));
      });
    }

    // FIXME: this used to be `dom-ready` but it doesn't seem to fire
    // on webcontents for webview.

    wc.once("did-finish-load", () => {
      logger.debug(`did-finish-load (once)`);
      if (DONT_SHOW_WEBVIEWS) {
        return;
      }

      createContextMenu(wc, store);

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
          tab,
          url: wc.getURL(),
          iframe: false,
        })
      );
    });

    wc.on("did-start-loading", () => {
      logger.debug(`did-start-loading`);
      pushWeb({ loading: true });
    });

    wc.on("did-stop-loading", () => {
      logger.debug(`did-stop-loading`);
      pushWeb({ loading: false });
    });

    // FIXME: page-title-updated isn't documented, see https://github.com/electron/electron/issues/10040
    // also, with electron@1.7.5, it seems to not always fire. whereas webview's event does.

    wc.on("page-favicon-updated", (ev, favicons) => {
      logger.debug(`Got page-favicon-updated: ${favicons[0]}`);
      pushWeb({ favicon: favicons[0] });
    });

    wc.on("did-navigate", (e, url) => {
      logger.debug(`did-navigate to ${url}`);
      didNavigate(url);
    });
    wc.on("did-navigate-in-page", (e, url, isMainFrame) => {
      logger.debug(
        `did-navigate-in-page to ${url}, isMainFrame = ${isMainFrame}`
      );
      if (isMainFrame) {
        didNavigate(url);
      }
    });

    wc.on(
      "new-window",
      (ev, url, frameName, disposition, options, additionalFeatures) => {
        const background = disposition === "background-tab";
        store.dispatch(actions.navigate({ tab: `url/${url}`, background }));
      }
    );
  });

  watcher.on(actions.analyzePage, async (store, action) => {
    const { tab, url, iframe } = action.payload;
    withWebContents(store, tab, async wc => {
      logger.debug(`Analyzing ${url}, iframe? ${iframe}`);
      if (isFrozen(tab)) {
        logger.debug(`Is frozen, won't analyze`);
        return;
      }

      const onNewPath = newPath => {
        if (newPath) {
          logger.debug(`Evolving to ${newPath}`);
          store.dispatch(
            actions.evolveTab({
              tab: tab,
              path: newPath,
            })
          );

          const parsed = urlParser.parse(url);
          if (parsed.search) {
            doSave(newPath, parsed.search, db);
          }
        } else {
          store.dispatch(
            actions.evolveTab({
              tab: tab,
              path: `url/${url}`,
            })
          );
        }
      };

      if (iframe) {
        const querylessUrl = url.replace(/\?.*$/, "");
        const dataUrl = `${querylessUrl}/data.json`;
        const data = await request("get", dataUrl, {}, { format: "json" });
        logger.debug(`iframe page data = ${JSON.stringify(data, null, 2)}`);
        if (data && data.body && data.body.id) {
          onNewPath(`games/${data.body.id}`);
        }
      } else {
        logger.debug(`Executing javascript on page`);
        const code = `(document.querySelector('meta[name="itch:path"]') || {}).content`;
        const newPath = await wc.executeJavaScript(code);
        logger.debug(`result of await: ${newPath}`);
        onNewPath(newPath);
      }
    });
  });

  watcher.on(actions.trigger, async (store, action) => {
    let { tab, command } = action.payload;
    if (!tab) {
      tab = store.getState().session.navigation.tab;
    }
    logger.debug(`Got command ${command} for tab ${tab}`);

    withWebContents(store, tab, wc => {
      let pushWeb = (web: Partial<ITabWeb>) => {
        store.dispatch(
          actions.tabDataFetched({
            tab,
            data: {
              web,
            },
          })
        );
      };

      switch (command) {
        case "goBack": {
          wc.goBack();
          break;
        }
        case "goForward": {
          wc.goForward();
          break;
        }
        case "reload": {
          wc.reload();
          break;
        }
        case "stop": {
          wc.stop();
          break;
        }
        case "location": {
          pushWeb({ editingAddress: true });
          break;
        }
        case "back": {
          pushWeb({ editingAddress: false });
          break;
        }
      }
    });
  });

  watcher.on(actions.openDevTools, async (store, action) => {
    const { forApp } = action.payload;
    if (forApp) {
      const bw = BrowserWindow.getFocusedWindow();
      if (bw && bw.webContents) {
        bw.webContents.openDevTools({ mode: "detach" });
      }
    } else {
      const { tab } = store.getState().session.navigation;
      withWebContents(store, tab, wc => {
        wc.openDevTools({ mode: "bottom" });
      });
    }
  });
}
