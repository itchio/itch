import { actions } from "common/actions";
import { Watcher } from "common/util/watcher";
import nodeURL from "url";

import { webContents, BrowserWindow } from "electron";

import rootLogger from "common/logger";
import { request } from "../net/request";
import { IStore, ITabWeb } from "common/types/index";
const logger = rootLogger.child({ name: "web-contents" });

import createContextMenu from "./web-contents-context-menu";
import { Space } from "common/helpers/space";
import { openAppDevTools } from "./open-app-devtools";

const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1;
const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === "1";

export type ExtendedWebContents = Electron.WebContents & {
  history: string[];
  currentIndex: number;
  pendingIndex: number;
  inPageIndex: number;
};

type WebContentsCallback<T> = (wc: ExtendedWebContents) => T;

function withWebContents<T>(
  store: IStore,
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

export default function(watcher: Watcher) {
  watcher.on(actions.tabGotWebContents, async (store, action) => {
    const { window, tab, webContentsId } = action.payload;
    logger.debug(`Got webContents ${webContentsId} for tab ${tab}`);

    const wc = webContents.fromId(webContentsId) as ExtendedWebContents;
    if (!wc) {
      logger.warn(`Couldn't get webContents for tab ${tab}`);
      return;
    }

    let pushWeb = (web: Partial<ITabWeb>) => {
      store.dispatch(
        actions.tabDataFetched({
          window,
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
            window,
            tab,
            url,
            resource,
            replace,
          })
        );
      }
    };

    logger.debug(`initial didNavigate with ${wc.getURL()}`);
    didNavigate(wc.getURL(), true);

    // FIXME: this used to be `dom-ready` but it doesn't seem to fire
    // on webcontents for webview.

    wc.once("did-finish-load", () => {
      logger.debug(`did-finish-load (once)`);
      if (DONT_SHOW_WEBVIEWS) {
        return;
      }

      createContextMenu(wc, window, store);

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
          window,
          tab,
          url: wc.getURL(),
          iframe: false,
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

    wc.on("page-favicon-updated", (ev, favicons) => {
      pushWeb({ favicon: favicons[0] });
    });

    wc.on(
      "new-window",
      (ev, url, frameName, disposition, options, additionalFeatures) => {
        const background = disposition === "background-tab";
        store.dispatch(actions.navigate({ url, window, background }));
      }
    );

    wc.on(
      "navigation-entry-commited" as any,
      (event, url, inPage, replaceEntry) => {
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

  watcher.on(actions.analyzePage, async (store, action) => {
    const { window, tab, url, iframe } = action.payload;
    await withWebContents(store, window, tab, async wc => {
      const onNewPath = (url: string, resource: string) => {
        if (resource) {
          // FIXME: we need this to be better - analyze can finish after we've already navigated away
          // so we need to only set resource if the url is what we think it is
          logger.debug(`Got resource ${resource}`);
          store.dispatch(
            actions.evolveTab({
              window,
              tab,
              url,
              resource,
              replace: true,
            })
          );
        }
      };

      if (iframe) {
        const parsed = nodeURL.parse(url);
        const { host, protocol, pathname } = parsed;
        const dataURL = nodeURL.format({
          host,
          protocol,
          pathname: `${pathname}/data.json`,
        });
        const data = await request("get", dataURL, {}, { format: "json" });
        if (data && data.body && data.body.id) {
          onNewPath(wc.getURL(), `games/${data.body.id}`);
        }
      } else {
        const code = `(document.querySelector('meta[name="itch:path"]') || {}).content`;
        const newPath = await wc.executeJavaScript(code);
        onNewPath(url, newPath);
      }
    });
  });

  watcher.on(actions.commandReload, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    withWebContents(store, window, tab, wc => {
      wc.reload();
    });
  });

  watcher.on(actions.commandStop, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    withWebContents(store, window, tab, wc => {
      wc.stop();
    });
  });

  watcher.on(actions.commandLocation, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    store.dispatch(
      actions.tabDataFetched({
        window,
        tab,
        data: {
          web: { editingAddress: true },
        },
      })
    );
  });

  watcher.on(actions.commandBack, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    store.dispatch(
      actions.tabDataFetched({
        window,
        tab,
        data: {
          web: { editingAddress: false },
        },
      })
    );
  });

  watcher.on(actions.openDevTools, async (store, action) => {
    const { window, forApp } = action.payload;
    if (forApp) {
      await openAppDevTools(BrowserWindow.getFocusedWindow());
    } else {
      const { tab } = store.getState().windows[window].navigation;
      withWebContents(store, window, tab, wc => {
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
