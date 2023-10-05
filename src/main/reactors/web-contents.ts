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

type WebContentsCallback<T> = (wc: Electron.WebContents) => T;

function withWebContents<T>(
  store: Store,
  wind: string,
  tab: string,
  cb: WebContentsCallback<T>
): T | null {
  const wc = getWebContents(wind, tab);
  if (wc && !wc.isDestroyed()) {
    return cb(wc);
  }
  return null;
}

function loadURL(wc: WebContents, url: string) {
  if (ITCH_URL_RE.test(url)) {
    return;
  }

  // Because of restrictions elsewhere, this likely only
  // occurs if the most recent url in a given tab was an
  // external page back when the app permitted that
  const parsedUrl = new URL(url);
  if (
    parsedUrl.origin.endsWith(".itch.io") ||
    parsedUrl.origin.endsWith("/itch.io")
  ) {
    wc.loadURL(url);
  }
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
    await hookWebContents(store, wind, tab, wc);
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
      logger.debug("HELLO THIS IS A TEST 2");
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
    logger.debug("HELLO THIS IS A TEST 3");
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
      const url = Space.fromState(rs, wind, tab).url();
      logger.debug("HELLO THIS IS A TEST 5");
      loadURL(wc, url);
    });
  });

  watcher.on(actions.evolveTab, async (store, action) => {
    const { wind, tab, url, replace, fromWebContents } = action.payload;
    if (replace || fromWebContents) {
      return;
    }
    logger.debug("HELLO THIS IS A TEST 6");

    withWebContents(store, wind, tab, async (wc) => {
      const webUrl = wc.getURL();
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
  wc: Electron.WebContents
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
    let code = `
      var mainBody = document.getElementsByTagName('body')[0];
      mainBody.classList.remove('dark_theme');
    `;
    wc.executeJavaScript(code);
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

  wc.setWindowOpenHandler(({ url }) => {
    logger.debug(`new-window fired for ${url}`);
    wc.loadURL(url);
    return { action: "deny" };
  });

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

  const commit = (
    reason: "will-navigate" | "did-navigate",
    event: any,
    url: string // latest URL
  ) => {
    const space = Space.fromStore(store, wind, tab);
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

    didNavigate(url, NavMode.Append);
  };
  wc.on("did-navigate", (event, url) => {
    commit("did-navigate", event, url);
  });
}
