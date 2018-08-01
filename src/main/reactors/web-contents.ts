import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Store, TabWeb } from "common/types";
import { Watcher } from "common/util/watcher";
import { BrowserWindow, webContents, WebContents } from "electron";
import { mainLogger } from "main/logger";
import nodeURL from "url";
import { openAppDevTools } from "main/reactors/open-app-devtools";
import createContextMenu from "main/reactors/web-contents-context-menu";

const logger = mainLogger.child(__filename);

const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1;
const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === "1";

type WebContentsCallback<T> = (wc: WebContents) => T;

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

  return cb(wc);
}

export default function(watcher: Watcher) {
  watcher.on(actions.tabGotFrame, async (store, action) => {
    logger.debug(`tab got frame!`);
  });

  watcher.on(actions.windOpened, async (store, action) => {
    const { wind, role, nativeId } = action.payload;
    if (role === "main") {
      logger.debug(`main window open, installing event listeners`);
      const bw = BrowserWindow.fromId(nativeId);
      const wc = bw.webContents;

      // FIXME: this doesn't work with multiple tabs, obviously
      let currentTab = () => {
        const { tab } = store.getState().winds[wind].navigation;
        return tab;
      };

      let pushWeb = (web: Partial<TabWeb>) => {
        const tab = currentTab();
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

      let isCurrentRoutingId = (routingId: number) => {
        const rs = store.getState();
        const ws = rs.winds[wind];
        const { tabInstances } = ws;
        const { tab } = ws.navigation;
        const ti = tabInstances[tab];
        if (typeof ti.routingId !== "undefined" && routingId === ti.routingId) {
          return true;
        }
        return false;
      };

      wc.on("did-start-loading", () => {
        pushWeb({ loading: true });
      });

      wc.on("did-stop-loading", () => {
        pushWeb({ loading: false });
      });

      wc.on(
        "did-start-navigation" as any,
        (
          ev: any,
          url: string,
          isInPlace: boolean,
          isMainFrame: boolean,
          frameProcessId: number,
          frameRoutingId: number
        ) => {
          logger.debug(`did-start-navigation url ${url}`);
          logger.debug(`frameProcessId ${frameProcessId}`);
          logger.debug(`frameRoutingId ${frameRoutingId}`);
          if (isCurrentRoutingId(frameRoutingId)) {
            logger.debug(
              `did-start-navigation ${isMainFrame} ${frameRoutingId} ${url} in-place ? ${isInPlace}`
            );

            (async () => {
              const code = `
              var ife = document.querySelector("iframe");
              ife.contentWindow.history.length;
            `;
              const historyLength = await new Promise<number>(
                (resolve, reject) => {
                  wc.executeJavaScript(code, false, resolve);
                }
              );
              logger.debug(`history length = ${historyLength}`);
            })()
              .catch(e => {
                console.error(`in did-navigate`);
                console.error(e);
              })
              .then(() => {
                console.log(`did-navigate async stuff finished`);
              });

            store.dispatch(
              actions.evolveTab({
                wind,
                // FIXME: map routingId to tab, not the other way around
                tab: currentTab(),
                url,
                replace: false,
              })
            );
          }
        }
      );

      wc.on("did-frame-navigate", (
        event: Event,
        url: string,
        /**
         * -1 for non HTTP navigations
         */
        httpResponseCode: number,
        /**
         * empty for non HTTP navigations,
         */
        httpStatusText: string,
        isMainFrame: boolean,
        frameProcessId: number,
        frameRoutingId: number
      ) => {
        if (isCurrentRoutingId(frameRoutingId)) {
          logger.debug(
            `did-frame-navigate ${isMainFrame} ${frameRoutingId} ${url} ${httpResponseCode}`
          );

          (async () => {
            const code = `
              var ife = document.querySelector("iframe");
              ife.contentWindow.history.length;
            `;
            const historyLength = await new Promise<number>(
              (resolve, reject) => {
                wc.executeJavaScript(code, false, resolve);
              }
            );
            logger.debug(`history length = ${historyLength}`);
          })()
            .catch(e => {
              console.error(`in did-navigate`);
              console.error(e);
            })
            .then(() => {
              console.log(`did-navigate async stuff finished`);
            });

          store.dispatch(
            actions.evolveTab({
              wind,
              // FIXME: map routingId to tab, not the other way around
              tab: currentTab(),
              url,
              replace: false,
            })
          );
        }
      });

      wc.on(
        "did-frame-finish-load",
        (
          event: Event,
          isMainFrame: boolean,
          frameProcessId: number,
          frameRoutingId: number
        ) => {
          if (isCurrentRoutingId(frameRoutingId)) {
            logger.debug(`did-frame-finish-load`);
          }
        }
      );

      wc.on(
        "did-navigate-in-page",
        (
          event: Event,
          url: string,
          isMainFrame: boolean,
          frameProcessId: number,
          frameRoutingId: number
        ) => {
          if (isCurrentRoutingId(frameRoutingId)) {
            logger.debug(
              `did-navigate-in-page ${isMainFrame} ${frameRoutingId} ${url}`
            );

            store.dispatch(
              actions.evolveTab({
                wind,
                // FIXME: map routingId to tab, not the other way around
                tab: currentTab(),
                url,
                replace: false,
              })
            );
          }
        }
      );
    }
  });

  watcher.on(actions.tabGotWebContents, async (store, action) => {
    const { wind, tab, webContentsId } = action.payload;
    logger.debug(`Got webContents ${webContentsId} for tab ${tab}`);

    const wc = webContents.fromId(webContentsId);
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

    logger.debug(`initial didNavigate with ${wc.getURL()}`);
    didNavigate(wc.getURL(), true);

    // FIXME: this used to be `dom-ready` but it doesn't seem to fire
    // on webcontents for webview.

    wc.once("did-finish-load", () => {
      logger.debug(`did-finish-load (once)`);
      if (DONT_SHOW_WEBVIEWS) {
        return;
      }

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

    // wc.on(
    //   "navigation-entry-commited" as any,
    //   (event: any, url: string, inPage: boolean, replaceEntry: boolean) => {
    //     logger.debug(`=================================`);
    //     logger.debug(
    //       `navigation entry committed: ${url}, inPage = ${inPage}, replaceEntry = ${replaceEntry}`
    //     );
    //     logger.debug(`history is now: ${JSON.stringify(wc.history, null, 2)}`);
    //     logger.debug(`currentIndex: ${wc.currentIndex}`);
    //     logger.debug(`inPageIndex: ${wc.inPageIndex}`);
    //     didNavigate(url, replaceEntry);
    //     logger.debug(`=================================`);
    //   }
    // );
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

  watcher.on(actions.commandReload, async (store, action) => {
    const { wind } = action.payload;
    const { tab } = store.getState().winds[wind].navigation;
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
