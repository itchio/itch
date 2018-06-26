import { Watcher } from "common/util/watcher";

import { screen } from "electron";
import { createSelector } from "reselect";
import { format as formatUrl, UrlObject } from "url";
import * as path from "path";

import env from "common/env";

import { darkMineShaft } from "common/constants/colors";
import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import config from "common/util/config";
import * as os from "../os";
import { debounce } from "underscore";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "main-window" });

import { actions } from "common/actions";

type AppCommand = "browser-backward" | "browser-forward";

const BOUNDS_CONFIG_KEY = "main_window_bounds";
const MAXIMIZED_CONFIG_KEY = "main_window_maximized";

const macOs = os.platform() === "darwin";

import {
  RootState,
  Store,
  NativeWindowState,
  ItchWindowRole,
} from "common/types";
import { Space } from "common/helpers/space";
import { openAppDevTools } from "./open-app-devtools";
import { t } from "common/format/t";
import { getImagePath } from "common/util/resources";
import { stringify } from "querystring";
import { opensInWindow } from "common/constants/windows";

async function createRootWindow(store: Store) {
  const window = "root";
  const role: ItchWindowRole = "main";
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
    ...commonBrowserWindowOpts(),
    title: app.getName(),
    width,
    height,
    center,
    show: false,
  };
  const nativeWindow = new BrowserWindow(opts);
  store.dispatch(
    actions.windowOpened({
      window,
      role,
      nativeId: nativeWindow.id,
      initialURL: "itch://library",
    })
  );

  if (os.platform() === "darwin") {
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

  hookNativeWindow(store, window, nativeWindow);

  nativeWindow.on("maximize", (e: any) => {
    config.set(MAXIMIZED_CONFIG_KEY, true);
  });

  nativeWindow.on("unmaximize", (e: any) => {
    config.set(MAXIMIZED_CONFIG_KEY, false);
  });

  nativeWindow.loadURL(makeAppURL({ window, role }));

  if (parseInt(process.env.DEVTOOLS || "0", 10) > 0) {
    await openAppDevTools(nativeWindow);
  }

  preloadWindow(store);
}

function preloadWindow(store: Store) {
  store.dispatch(
    actions.openWindow({
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

  watcher.on(actions.windowOpened, async (store, action) => {
    refreshSelectors(store.getState());
  });

  watcher.on(actions.windowClosed, async (store, action) => {
    refreshSelectors(store.getState());
  });

  watcher.on(actions.preboot, async (store, action) => {
    await createRootWindow(store);
  });

  watcher.on(actions.preferencesLoaded, async (store, action) => {
    const hidden = action.payload.openAsHidden;
    if (!hidden) {
      store.dispatch(actions.focusWindow({ window: "root" }));
    }

    screen.on("display-added", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-removed", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-metrics-changed", () =>
      ensureMainWindowInsideDisplay(store)
    );
  });

  watcher.on(actions.focusWindow, async (store, action) => {
    const { window } = action.payload;
    const nativeWindow = getNativeWindow(store.getState(), window);
    const { toggle } = action.payload;

    if (nativeWindow) {
      if (toggle && nativeWindow.isVisible()) {
        nativeWindow.hide();
      } else {
        if (window === "root") {
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

  watcher.on(actions.hideWindow, async (store, action) => {
    hideWindow();
  });

  watcher.on(actions.minimizeWindow, async (store, action) => {
    minimizeWindow();
  });

  watcher.on(actions.toggleMaximizeWindow, async (store, action) => {
    toggleMaximizeWindow();
  });

  watcher.on(actions.commandBack, async (store, action) => {
    exitFullScreen();
  });

  watcher.on(actions.windowBoundsChanged, async (store, action) => {
    const { window, bounds } = action.payload;
    const nativeWindow = getNativeWindow(store.getState(), window);
    if (nativeWindow.isMaximized()) {
      // don't store bounds when maximized
      return;
    }

    if (window === "root") {
      config.set(BOUNDS_CONFIG_KEY, bounds);
    } else {
      const navState = store.getState().windows[window].navigation;
      const { initialURL } = navState;
      const configKey = `${initialURL}-bounds`;
      config.set(configKey, bounds);
    }
  });

  watcher.on(actions.closeTabOrAuxWindow, async (store, action) => {
    const { window } = action.payload;
    store.dispatch(actions.closeCurrentTab({ window }));
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

  watcher.on(actions.openWindow, async (store, action) => {
    const { initialURL, preload } = action.payload;
    const rs = store.getState();

    if (opensInWindow[initialURL]) {
      // see if we already have a window with that initialURL
      for (const window of Object.keys(rs.windows)) {
        const windowState = rs.windows[window];
        if (windowState.navigation.initialURL === initialURL) {
          const nativeWin = getNativeWindow(rs, window);
          if (nativeWin) {
            nativeWin.show();
            nativeWin.focus();

            store.dispatch(
              actions.windowAwakened({
                initialURL,
                window,
              })
            );
            store.dispatch(
              actions.navigate({
                window,
                url: initialURL,
              })
            );
            return;
          }
        }
      }
    }

    if (!preload) {
      // do we have a preload available?
      let numPreload = 0;
      for (const window of Object.keys(rs.windows)) {
        const windowState = rs.windows[window];
        if (windowState.navigation.isPreload) {
          numPreload++;
        }
      }

      for (const window of Object.keys(rs.windows)) {
        const windowState = rs.windows[window];
        if (windowState.navigation.isPreload) {
          const nativeWin = getNativeWindow(rs, window);
          if (nativeWin) {
            // yes we do! use that.
            store.dispatch(
              actions.windowAwakened({
                initialURL,
                window,
              })
            );
            store.dispatch(
              actions.navigate({
                window,
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
      ...commonBrowserWindowOpts(),
      title: app.getName(),
    };
    if (preload) {
      opts.show = false;
    }

    const nativeWindow = new BrowserWindow(opts);
    const window = `secondary-${secondaryWindowSeed++}`;
    const role: ItchWindowRole = "secondary";
    store.dispatch(
      actions.windowOpened({
        window,
        role,
        nativeId: nativeWindow.id,
        initialURL: initialURL,
        preload,
      })
    );
    nativeWindow.loadURL(makeAppURL({ window, role }));
    hookNativeWindow(store, window, nativeWindow);
  });
}

interface AppURLParams {
  window: string;
  role: ItchWindowRole;
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

function commonBrowserWindowOpts(): Partial<BrowserWindowConstructorOptions> {
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
    },
  };
}

function hookNativeWindow(
  store: Store,
  window: string,
  nativeWindow: BrowserWindow
) {
  nativeWindow.on("focus", (e: any) => {
    store.dispatch(actions.windowFocusChanged({ window, focused: true }));
  });

  nativeWindow.on("blur", (e: any) => {
    store.dispatch(actions.windowFocusChanged({ window, focused: false }));
  });

  nativeWindow.on("enter-full-screen", (e: any) => {
    const ns = store.getState().windows[window].native;
    if (!ns.fullscreen) {
      store.dispatch(
        actions.windowFullscreenChanged({ window, fullscreen: true })
      );
    }
  });

  nativeWindow.on("leave-full-screen", (e: any) => {
    const ns = store.getState().windows[window].native;
    if (ns.fullscreen) {
      store.dispatch(
        actions.windowFullscreenChanged({ window, fullscreen: false })
      );
    }
  });

  nativeWindow.on("maximize", (e: any) => {
    const ns = store.getState().windows[window].native;
    if (!ns.maximized) {
      store.dispatch(
        actions.windowMaximizedChanged({ window, maximized: true })
      );
    }
  });

  nativeWindow.on("unmaximize", (e: any) => {
    const ns = store.getState().windows[window].native;
    if (ns.maximized) {
      store.dispatch(
        actions.windowMaximizedChanged({ window, maximized: false })
      );
    }
  });

  nativeWindow.on("app-command", (e, cmd) => {
    switch (cmd as AppCommand) {
      case "browser-backward":
        store.dispatch(
          actions.commandGoBack({
            window,
          })
        );
        break;
      case "browser-forward":
        store.dispatch(
          actions.commandGoForward({
            window,
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
    store.dispatch(
      actions.windowBoundsChanged({ window, bounds: windowBounds })
    );
  }, 2000);

  nativeWindow.on("move", (e: any) => {
    debouncedBounds();
  });

  nativeWindow.on("resize", (e: any) => {
    debouncedBounds();
  });

  nativeWindow.on("close", (e: any) => {
    if (window !== "root") {
      e.preventDefault();
      nativeWindow.hide();
      store.dispatch(actions.windowLulled({ window }));
    } else {
      store.dispatch(actions.windowClosed({ window }));
    }
  });

  nativeWindow.on("closed", (e: any) => {
    store.dispatch(actions.windowClosed({ window }));
  });
}

export function getNativeState(
  rs: RootState,
  window: string
): NativeWindowState {
  const w = rs.windows[window];
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
  const watcher = new Watcher();
  for (const window of Object.keys(rs.windows)) {
    watcher.onStateChange({
      makeSelector: (store, schedule) => {
        const getI18n = (rs: RootState) => rs.i18n;
        const getID = (rs: RootState) => rs.windows[window].navigation.tab;
        const getTabInstance = (rs: RootState) =>
          rs.windows[window].tabInstances;

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
