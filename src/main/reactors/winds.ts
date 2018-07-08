import { actions } from "common/actions";
import { darkMineShaft } from "common/constants/colors";
import { opensInWindow } from "common/constants/windows";
import env from "common/env";
import { t } from "common/format/t";
import { Space } from "common/helpers/space";
import { NativeWindowState, RootState, Store, WindRole } from "common/types";
import config from "common/util/config";
import { getImagePath } from "common/util/resources";
import { Watcher } from "common/util/watcher";
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
  session,
} from "electron";
import { mainLogger } from "main/logger";
import * as path from "path";
import { stringify } from "querystring";
import { createSelector } from "reselect";
import { debounce } from "underscore";
import { format as formatUrl, UrlObject } from "url";
import { openAppDevTools } from "./open-app-devtools";
import { LOOPBACK_PARTITION_NAME } from "common/constants/net";

const logger = mainLogger.child(__filename);

type AppCommand = "browser-backward" | "browser-forward";

const BOUNDS_CONFIG_KEY = "main_window_bounds";
const MAXIMIZED_CONFIG_KEY = "main_window_maximized";

const macOs = process.platform === "darwin";

const preloadEnabled = !env.integrationTests;

async function createRootWindow(store: Store) {
  const wind = "root";
  const role: WindRole = "main";
  const userBounds = config.get(BOUNDS_CONFIG_KEY) || {};
  const bounds = {
    x: -1,
    y: -1,
    width: 1250,
    height: 720,
    ...userBounds,
  };
  const { width, height } = bounds;
  const center = bounds.x === -1 && bounds.y === -1;

  let opts: Electron.BrowserWindowConstructorOptions = {
    ...commonBrowserWindowOpts(store),
    title: app.getName(),
    width,
    height,
    center,
    show: false,
  };
  const nativeWindow = new BrowserWindow(opts);
  store.dispatch(
    actions.windOpened({
      wind,
      role,
      nativeId: nativeWindow.id,
      initialURL: "itch://library",
    })
  );

  if (process.platform === "darwin") {
    try {
      app.dock.setIcon(getIconPath());
    } catch (err) {
      logger.warn(`Could not set dock icon: ${err.stack}`);
    }
  }

  if (!center) {
    nativeWindow.setPosition(bounds.x, bounds.y);
  }
  ensureWindowInsideDisplay(nativeWindow);

  nativeWindow.on("close", (e: any) => {
    const prefs = store.getState().preferences || { closeToTray: true };

    let { closeToTray } = prefs;
    if (env.integrationTests) {
      // always let app close in testing
      closeToTray = false;
    }

    if (closeToTray) {
      logger.debug("Close to tray enabled");
    } else {
      logger.debug("Close to tray disabled, quitting!");
      process.nextTick(() => {
        store.dispatch(actions.quit({}));
      });
      return;
    }

    if (!nativeWindow.isVisible()) {
      logger.info("Main window hidden, letting it close");
      return;
    }

    if (!prefs.gotMinimizeNotification) {
      store.dispatch(
        actions.updatePreferences({
          gotMinimizeNotification: true,
        })
      );

      const i18n = store.getState().i18n;
      store.dispatch(
        actions.notify({
          title: t(i18n, ["notification.see_you_soon.title"]),
          body: t(i18n, ["notification.see_you_soon.message"]),
        })
      );
    }

    // hide, never destroy
    e.preventDefault();
    logger.info("Hiding main window");
    nativeWindow.hide();
  });

  hookNativeWindow(store, wind, nativeWindow);

  nativeWindow.on("maximize", (e: any) => {
    config.set(MAXIMIZED_CONFIG_KEY, true);
  });

  nativeWindow.on("unmaximize", (e: any) => {
    config.set(MAXIMIZED_CONFIG_KEY, false);
  });

  nativeWindow.loadURL(makeAppURL({ wind, role }));

  if (parseInt(process.env.DEVTOOLS || "0", 10) > 0) {
    await openAppDevTools(nativeWindow);
  }

  preloadWindow(store);
}

function preloadWindow(store: Store) {
  if (!preloadEnabled) {
    return;
  }

  store.dispatch(
    actions.openWind({
      initialURL: "itch://preload",
      role: "secondary",
      preload: true,
    })
  );
}

/**
 * Make sure the window isn't outside the bounds of the screen,
 * cf. https://github.com/itchio/itch/issues/1051
 */
function ensureWindowInsideDisplay(nativeWindow: Electron.BrowserWindow) {
  if (!nativeWindow || !nativeWindow.isVisible()) {
    return;
  }

  const originalBounds = nativeWindow.getBounds();
  logger.debug(
    `Ensuring ${JSON.stringify(originalBounds)} is inside a display`
  );

  const display = screen.getDisplayMatching(originalBounds);
  if (!display) {
    logger.warn(`No display found matching ${JSON.stringify(originalBounds)}`);
    return;
  }

  const displayBounds = display.bounds;
  logger.debug(`Display bounds: ${JSON.stringify(displayBounds)}`);

  let bounds = originalBounds;

  const displayLeft = displayBounds.x;
  if (bounds.x < displayLeft) {
    bounds = { ...bounds, x: displayLeft };
  }

  const displayTop = displayBounds.y;
  if (bounds.y < displayTop) {
    bounds = { ...bounds, y: displayTop };
  }

  const displayRight = displayBounds.width + displayBounds.x;
  if (bounds.x + bounds.width > displayRight) {
    bounds = { ...bounds, x: displayRight - bounds.width };
  }

  const displayBottom = displayBounds.height + displayBounds.y;
  if (bounds.y + bounds.height > displayBottom) {
    bounds = { ...bounds, y: displayBottom - bounds.height };
  }

  if (bounds !== originalBounds) {
    logger.debug(`New bounds: ${JSON.stringify(bounds)}`);
    nativeWindow.setBounds(bounds);
  }
}

async function hideWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
}

async function minimizeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
}

async function toggleMaximizeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
}

async function exitFullScreen() {
  const nativeWindow = BrowserWindow.getFocusedWindow();
  if (nativeWindow && nativeWindow.isFullScreen()) {
    nativeWindow.setFullScreen(false);
  }
}

function ensureMainWindowInsideDisplay(store: Store) {
  const nativeWindow = getNativeWindow(store.getState(), "root");
  if (nativeWindow) {
    return ensureWindowInsideDisplay(nativeWindow);
  }
}

let secondaryWindowSeed = 1;

export default function(watcher: Watcher) {
  let subWatcher: Watcher;

  const refreshSelectors = (rs: RootState) => {
    watcher.removeSub(subWatcher);
    subWatcher = makeSubWatcher(rs);
    watcher.addSub(subWatcher);
  };

  watcher.on(actions.openModal, async (store, action) => {
    const { wind } = action.payload;
    const nativeWind = getNativeWindow(store.getState(), wind);
    if (nativeWind) {
      nativeWind.focus();
    }
  });

  watcher.on(actions.windOpened, async (store, action) => {
    refreshSelectors(store.getState());
  });

  watcher.on(actions.windClosed, async (store, action) => {
    refreshSelectors(store.getState());
  });

  watcher.on(actions.preboot, async (store, action) => {
    await createRootWindow(store);
  });

  watcher.on(actions.preferencesLoaded, async (store, action) => {
    const hidden = action.payload.openAsHidden;
    if (!hidden) {
      store.dispatch(actions.focusWind({ wind: "root" }));
    }

    screen.on("display-added", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-removed", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-metrics-changed", () =>
      ensureMainWindowInsideDisplay(store)
    );
  });

  watcher.on(actions.focusWind, async (store, action) => {
    const { wind } = action.payload;
    const nativeWindow = getNativeWindow(store.getState(), wind);
    const { toggle } = action.payload;

    if (nativeWindow) {
      if (toggle && nativeWindow.isVisible()) {
        nativeWindow.hide();
      } else {
        if (wind === "root") {
          nativeWindow.show();
          const maximized = config.get(MAXIMIZED_CONFIG_KEY) || false;
          if (maximized && !macOs) {
            nativeWindow.maximize();
          }

          if (!maximized) {
            ensureWindowInsideDisplay(nativeWindow);
          }
        }
      }
    }
  });

  watcher.on(actions.hideWind, async (store, action) => {
    hideWindow();
  });

  watcher.on(actions.minimizeWind, async (store, action) => {
    minimizeWindow();
  });

  watcher.on(actions.toggleMaximizeWind, async (store, action) => {
    toggleMaximizeWindow();
  });

  watcher.on(actions.commandBack, async (store, action) => {
    exitFullScreen();
  });

  watcher.on(actions.windBoundsChanged, async (store, action) => {
    const { wind, bounds } = action.payload;
    const nativeWindow = getNativeWindow(store.getState(), wind);
    if (nativeWindow.isMaximized()) {
      // don't store bounds when maximized
      return;
    }

    if (wind === "root") {
      config.set(BOUNDS_CONFIG_KEY, bounds);
    } else {
      const navState = store.getState().winds[wind].navigation;
      const { initialURL } = navState;
      const configKey = `${initialURL}-bounds`;
      config.set(configKey, bounds);
    }
  });

  watcher.on(actions.closeTabOrAuxWindow, async (store, action) => {
    const { wind } = action.payload;
    store.dispatch(actions.closeCurrentTab({ wind }));
  });

  watcher.on(actions.quitWhenMain, async (store, action) => {
    const mainId = getNativeState(store.getState(), "root").id;
    const focused = BrowserWindow.getFocusedWindow();

    if (focused) {
      if (focused.id === mainId) {
        store.dispatch(actions.quit({}));
      } else {
        focused.close();
      }
    }
  });

  watcher.on(actions.quit, async (store, action) => {
    app.exit(0);
  });

  watcher.on(actions.openWind, async (store, action) => {
    const { initialURL, preload } = action.payload;
    const rs = store.getState();

    if (opensInWindow[initialURL]) {
      // see if we already have a window with that initialURL
      for (const wind of Object.keys(rs.winds)) {
        const windState = rs.winds[wind];
        if (windState.navigation.initialURL === initialURL) {
          const nativeWin = getNativeWindow(rs, wind);
          if (nativeWin) {
            nativeWin.show();
            nativeWin.focus();

            store.dispatch(
              actions.windAwakened({
                initialURL,
                wind,
              })
            );
            store.dispatch(
              actions.navigate({
                wind,
                url: initialURL,
              })
            );
            return;
          }
        }
      }
    }

    if (!preload && preloadEnabled) {
      // do we have a preload available?
      let numPreload = 0;
      for (const window of Object.keys(rs.winds)) {
        const windowState = rs.winds[window];
        if (windowState.navigation.isPreload) {
          numPreload++;
        }
      }

      for (const wind of Object.keys(rs.winds)) {
        const windowState = rs.winds[wind];
        if (windowState.navigation.isPreload) {
          const nativeWin = getNativeWindow(rs, wind);
          if (nativeWin) {
            // yes we do! use that.
            store.dispatch(
              actions.windAwakened({
                initialURL,
                wind,
              })
            );
            store.dispatch(
              actions.navigate({
                wind,
                url: initialURL,
              })
            );

            const configKey = `${initialURL}-bounds`;
            const bounds = config.get(configKey);
            if (bounds) {
              nativeWin.setBounds(bounds);
            } else {
              nativeWin.center();
            }

            setTimeout(() => {
              let opacity = 0;
              nativeWin.setOpacity(opacity);
              nativeWin.show();

              let interval: NodeJS.Timer;
              let cb = () => {
                opacity += 0.1;

                if (opacity >= 1.0) {
                  opacity = 1.0;
                  clearInterval(interval);
                }
                nativeWin.setOpacity(opacity);
              };
              interval = setInterval(cb, 16);
            }, 250);

            // if this was the last preload, preload another one
            if (numPreload === 1) {
              preloadWindow(store);
            }

            return;
          }
        }
      }
    }

    const opts: BrowserWindowConstructorOptions = {
      ...commonBrowserWindowOpts(store),
      title: app.getName(),
    };
    if (preload) {
      opts.show = false;
    }

    const nativeWindow = new BrowserWindow(opts);
    const wind = `secondary-${secondaryWindowSeed++}`;
    const role: WindRole = "secondary";
    store.dispatch(
      actions.windOpened({
        wind,
        role,
        nativeId: nativeWindow.id,
        initialURL: initialURL,
        preload,
      })
    );
    nativeWindow.loadURL(makeAppURL({ wind, role }));
    hookNativeWindow(store, wind, nativeWindow);
  });
}

interface AppURLParams {
  wind: string;
  role: WindRole;
}

function makeAppURL(params: AppURLParams): string {
  let urlObject: UrlObject;
  if (env.development) {
    urlObject = {
      pathname: "/",
      protocol: "http",
      hostname: "localhost",
      port: process.env.ELECTRON_WEBPACK_WDS_PORT,
    };
  } else {
    urlObject = {
      pathname: path.resolve(__dirname, "..", "renderer", "index.html"),
      protocol: "file",
      slashes: true,
    };
  }
  urlObject.search = stringify(params);

  return formatUrl(urlObject);
}

function getIconPath(): string {
  let iconName = "icon";
  if (process.platform === "win32") {
    iconName = "icon-32";
  }

  return getImagePath("window/" + env.appName + "/" + iconName + ".png");
}

const nodeButlerdPartition = "__node-butlerd__";

function commonBrowserWindowOpts(
  store: Store
): Partial<BrowserWindowConstructorOptions> {
  const customSession = session.fromPartition(nodeButlerdPartition);

  return {
    icon: getIconPath(),
    autoHideMenuBar: true,
    backgroundColor: darkMineShaft,
    titleBarStyle: "hidden",
    frame: false,
    webPreferences: {
      affinity: "all-in-one",
      blinkFeatures: "ResizeObserver",
      webSecurity: env.development ? false : true,
      session: customSession,
    },
  };
}

function hookNativeWindow(
  store: Store,
  wind: string,
  nativeWindow: BrowserWindow
) {
  nativeWindow.on("focus", (e: any) => {
    store.dispatch(actions.windFocusChanged({ wind, focused: true }));
  });

  nativeWindow.on("blur", (e: any) => {
    store.dispatch(actions.windFocusChanged({ wind, focused: false }));
  });

  nativeWindow.on("enter-full-screen", (e: any) => {
    const ns = store.getState().winds[wind].native;
    if (!ns.fullscreen) {
      store.dispatch(actions.windFullscreenChanged({ wind, fullscreen: true }));
    }
  });

  nativeWindow.on("leave-full-screen", (e: any) => {
    const ns = store.getState().winds[wind].native;
    if (ns.fullscreen) {
      store.dispatch(
        actions.windFullscreenChanged({ wind, fullscreen: false })
      );
    }
  });

  nativeWindow.on("maximize", (e: any) => {
    const ns = store.getState().winds[wind].native;
    if (!ns.maximized) {
      store.dispatch(actions.windMaximizedChanged({ wind, maximized: true }));
    }
  });

  nativeWindow.on("unmaximize", (e: any) => {
    const ns = store.getState().winds[wind].native;
    if (ns.maximized) {
      store.dispatch(actions.windMaximizedChanged({ wind, maximized: false }));
    }
  });

  nativeWindow.on("app-command", (e, cmd) => {
    switch (cmd as AppCommand) {
      case "browser-backward":
        store.dispatch(
          actions.commandGoBack({
            wind,
          })
        );
        break;
      case "browser-forward":
        store.dispatch(
          actions.commandGoForward({
            wind,
          })
        );
        break;
      default:
      // ignore unknown app commands
    }
  });

  const debouncedBounds = debounce(() => {
    if (nativeWindow.isDestroyed()) {
      return;
    }
    const windowBounds = nativeWindow.getBounds();
    store.dispatch(actions.windBoundsChanged({ wind, bounds: windowBounds }));
  }, 2000);

  nativeWindow.on("move", (e: any) => {
    debouncedBounds();
  });

  nativeWindow.on("resize", (e: any) => {
    debouncedBounds();
  });

  nativeWindow.on("close", (e: any) => {
    if (wind !== "root" && preloadEnabled) {
      e.preventDefault();
      nativeWindow.hide();
      store.dispatch(actions.windLulled({ wind }));
    } else {
      store.dispatch(actions.windClosed({ wind }));
    }
  });

  nativeWindow.on("closed", (e: any) => {
    store.dispatch(actions.windClosed({ wind }));
  });
}

export function getNativeState(
  rs: RootState,
  window: string
): NativeWindowState {
  const w = rs.winds[window];
  if (w) {
    return w.native;
  }
  return null;
}

export function getNativeWindow(rs: RootState, window: string): BrowserWindow {
  const ns = getNativeState(rs, window);
  if (ns) {
    return BrowserWindow.fromId(ns.id);
  }
  return null;
}

function makeSubWatcher(rs: RootState) {
  const watcher = new Watcher(mainLogger);
  for (const window of Object.keys(rs.winds)) {
    watcher.onStateChange({
      makeSelector: (store, schedule) => {
        const getI18n = (rs: RootState) => rs.i18n;
        const getID = (rs: RootState) => rs.winds[window].navigation.tab;
        const getTabInstance = (rs: RootState) => rs.winds[window].tabInstances;

        const getSpace = createSelector(getID, getTabInstance, (id, tabData) =>
          Space.fromInstance(id, tabData[id])
        );

        return createSelector(getI18n, getSpace, (i18n, sp) => {
          const nativeWindow = getNativeWindow(store.getState(), window);
          if (nativeWindow && !nativeWindow.isDestroyed()) {
            const label = t(i18n, sp.label());
            let title: string;
            if (label) {
              title = `${label} - ${app.getName()}`;
            } else {
              title = `${app.getName()}`;
            }
            nativeWindow.setTitle(title);
          }
        });
      },
    });
  }
  return watcher;
}
