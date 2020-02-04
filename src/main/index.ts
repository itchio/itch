import { Profile } from "common/butlerd/messages";
import { DownloadsState } from "common/downloads";
import env from "common/env";
import { OngoingLaunches } from "common/launches";
import { CurrentLocale, LocaleStrings } from "common/locales";
import { packets } from "common/packets";
import dump from "common/util/dump";
import { partitionForApp } from "common/util/partitions";
import {
  app,
  BrowserWindow,
  dialog,
  session,
  shell,
  Tray,
  Menu,
} from "electron";
import { envSettings } from "main/constants/env-settings";
import {
  registerItchProtocol,
  registerSchemesAsPrivileged,
} from "main/itch-protocol";
import { loadPreferences, wasOpenedAsHidden } from "main/preferences";
import { mainLogger } from "main/logger";
import { attemptAutoLogin } from "main/profile";
import { setupShortcuts } from "main/setup-shortcuts";
import { ButlerState, startButler } from "main/start-butler";
import { broadcastPacket } from "main/websocket-handler";
import { startWebSocketServer, WebSocketState } from "main/websocket-server";
import { shellBgDefault } from "renderer/theme";
import { ModalsState, modals } from "common/modals";
import { PreferencesState } from "common/preferences";
import { join } from "path";
import { initTray } from "main/tray";
import { showModal } from "main/show-modal";

let logger = mainLogger.childWithName("main");

export interface LocalesConfig {
  locales: {
    value: string;
    label: string;
  }[];
}

export interface MainState {
  startedAt: number;
  butler?: ButlerState;
  websocket?: WebSocketState;
  profile?: Profile;
  webview: WebviewState;
  preferences?: PreferencesState;
  localesConfig?: LocalesConfig;
  localeState?: LocaleState;
  ongoingLaunches: OngoingLaunches;
  preparingLaunches: {
    [gameId: string]: boolean;
  };
  downloads?: DownloadsState;
  browserWindow?: BrowserWindow;
  tray?: Tray;
  modals: ModalsState;
}

export interface LocaleState {
  englishStrings: LocaleStrings;
  current: CurrentLocale;
}

export interface WebviewState {
  history: string[];
  currentIndex: number;
}

const ms: MainState = {
  startedAt: Date.now(),
  webview: {
    history: ["itch://library"],
    currentIndex: 0,
  },
  ongoingLaunches: {},
  preparingLaunches: {},
  modals: {},
};

async function main() {
  {
    let appInfo = `${env.appName}@${app.getVersion()}`;
    let electronInfo = `electron@${process.versions.electron}`;
    logger.info(`${appInfo} on ${electronInfo} in ${env.name}`);
  }

  if (envSettings.dumpEnvSettings) {
    const logger = mainLogger.childWithName("env-settings");
    logger.info(`full env settings:\n${dump(envSettings)}`);
  }

  if (env.development) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
    } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name: string) => logger.info(`Added Extension:  ${name}`))
      .catch((err: Error) => console.log("An error occurred: ", err));
  }

  registerSchemesAsPrivileged();

  app.on("web-contents-created", (ev, wc) => {
    if (wc.hostWebContents?.id == ms.browserWindow?.webContents?.id) {
      // this means it's the webview webcontents.
      // other webcontents are created, for devtools for example,
      // but those have no host webcontents.
      setupShortcuts(ms, wc);

      wc.on("will-navigate", (ev, urlText) => {
        let url = new URL(urlText);
        if (url.protocol === "itch:" && url.hostname === "install") {
          ev.preventDefault();

          let gameId = parseInt(url.searchParams.get("game_id")!, 10);
          let uploadId =
            parseInt(url.searchParams.get("upload_id")!, 10) || undefined;
          let buildId =
            parseInt(url.searchParams.get("build_id")!, 10) || undefined;

          showModal(ms, modals.install, {
            gameId,
            uploadId,
            buildId,
          }).catch(e => console.warn(e.stack));
          return;
        }
      });
    } else {
      wc.on("will-navigate", (ev, url) => {
        shell.openExternal(url);
      });
    }
  });

  // 🎃🎃🎃
  // see https://github.com/electron/electron/issues/20127
  app.allowRendererProcessReuse = true;

  let promises: Promise<void>[] = [];
  promises.push(
    new Promise((resolve, reject) => {
      app.on("ready", () => resolve());
    })
  );
  promises.push(loadPreferences(ms));
  promises.push(startButler(ms));
  promises.push(startWebSocketServer(ms));
  await Promise.all(promises);
  logger.debug(`butler & websocket started`);

  await attemptAutoLogin(ms);

  onReady().catch(e => {
    dialog.showErrorBox("Fatal error", e.stack);
    app.exit(2);
  });
}

async function onReady() {
  const partition = partitionForApp();
  await registerItchProtocol(ms, partition);
  let rendererSession = session.fromPartition(partition);

  logger.debug(`Setting proxy rules...`);
  let beforeProxy = Date.now();
  rendererSession
    .setProxy({
      pacScript: null as any,
      proxyRules: null as any,
      proxyBypassRules: "<local>",
    })
    .then(() => {
      logger.debug(
        `Proxy rules were set. Took ${Date.now() - beforeProxy} ms.`
      );
    });

  initTray(ms);

  let win = new BrowserWindow({
    title: env.appName,
    width: 1280,
    height: 720,
    frame: false,
    backgroundColor: shellBgDefault,
    show: false,
    webPreferences: {
      session: rendererSession,
      webviewTag: true,
    },
  });
  ms.browserWindow = win;
  setupShortcuts(ms, win.webContents);

  win.on("maximize", () => {
    broadcastPacket(ms, packets.maximizedChanged, { maximized: true });
  });
  win.on("unmaximize", () => {
    broadcastPacket(ms, packets.maximizedChanged, { maximized: false });
  });
  win.setMenu(null);
  win.setMenuBarVisibility(false);
  win.webContents.addListener("will-navigate", (ev, url) => {
    ev.preventDefault();
    broadcastPacket(ms, packets.navigate, {
      url,
    });
  });
  logger.debug(`Loading main browser window...`);
  await win.loadURL("itch://app");
  let elapsed = (Date.now() - ms.startedAt).toFixed();
  logger.info(`Main window loaded (${elapsed}ms after startup)`);
  if (wasOpenedAsHidden(ms)) {
    logger.info(`Keeping hidden (was autostarted + openAsHidden is set)`);
  } else {
    win.show();
  }

  win.webContents.on("new-window", (ev, url, frameName, disposition) => {
    ev.preventDefault();
    shell.openExternal(url);
  });

  win.on("close", ev => {
    if (ms.preferences?.closeToTray) {
      if (win.isVisible()) {
        logger.info(`Closing to tray...`);
        ev.preventDefault();
        win.hide();
      } else {
        logger.info(`Closing for real`);
      }
    }
  });

  if (envSettings.devtools) {
    win.webContents.openDevTools({
      mode: "detach",
    });
  }
}

main().catch(e => {
  dialog.showErrorBox(`${app.name} failed to start`, e.stack);
  app.exit(1);
});
