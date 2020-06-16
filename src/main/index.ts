import { DownloadsState } from "common/downloads";
import env from "common/env";
import { OngoingLaunches } from "common/launches";
import { CurrentLocale, LocaleStrings } from "common/locales";
import { modals, ModalsState } from "common/modals";
import { packets } from "common/packets";
import { PreferencesState } from "common/preferences";
import dump from "common/util/dump";
import { partitionForApp } from "common/util/partitions";
import { WebviewState } from "common/webview-state";
import { app, BrowserWindow, dialog, session, shell, Tray } from "electron";
import { envSettings } from "main/constants/env-settings";
import {
  registerItchProtocol,
  registerSchemesAsPrivileged,
} from "main/itch-protocol";
import { mainLogger } from "main/logger";
import { loadPreferences, wasOpenedAsHidden } from "main/preferences";
import { attemptAutoLogin } from "main/profile";
import { setupShortcuts } from "main/setup-shortcuts";
import { showModal } from "main/show-modal";
import { initializeValet } from "main/initialize-valet";
import { initTray } from "main/tray";
import { broadcastPacket } from "main/socket-handler";
import { startSocketServer, SocketState } from "main/socket-server";
import { shellBgDefault } from "renderer/theme";
import { Profile } from "@itchio/valet/messages";

let logger = mainLogger.childWithName("main");

export interface LocalesConfig {
  locales: {
    value: string;
    label: string;
  }[];
}

export interface LaunchController {
  cancel: (reason: string) => void;
}

export interface MainState {
  startedAt: number;
  socket?: SocketState;
  profile?: Profile;
  webview: WebviewState;
  preferences?: PreferencesState;
  localesConfig?: LocalesConfig;
  localeState?: LocaleState;
  ongoingLaunches: OngoingLaunches;
  launchControllers: {
    [launchId: string]: LaunchController;
  };
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

const ms: MainState = {
  startedAt: Date.now(),
  webview: {
    history: ["itch://library"],
    currentIndex: 0,
  },
  ongoingLaunches: {},
  preparingLaunches: {},
  launchControllers: {},
  modals: {},
};

async function main() {
  if (process.env.ITCH_INTEGRATION_TESTS !== "1") {
    let isSingleInstance = app.requestSingleInstanceLock();
    if (!isSingleInstance) {
      logger.info(`We're not the main instance, exiting`);
      app.exit(0);
    }

    app.on("second-instance", (ev, commandLine, workingDirectory) => {
      logger.info(`Second instance was created, focusing ours`);
      // FIXME: do not ignore command line
      logger.warn(`Ignoring command line: ${commandLine}`);
      ms.browserWindow?.focus();
    });
  }

  {
    let appInfo = `${env.appName}@${app.getVersion()}`;
    let electronInfo = `electron@${process.versions.electron}`;
    logger.info(`${appInfo} on ${electronInfo} in ${env.name}`);
  }

  if (envSettings.dumpEnvSettings) {
    const logger = mainLogger.childWithName("env-settings");
    logger.info(`full env settings:\n${dump(envSettings)}`);
  }

  registerSchemesAsPrivileged();

  app.on("web-contents-created", (ev, wc) => {
    if (wc.hostWebContents?.id == ms.browserWindow?.webContents?.id) {
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
          }).catch((e) => console.warn(e.stack));
          return;
        }
      });
    } else {
      wc.on("will-navigate", (ev, url) => {
        shell.openExternal(url);
      });
    }
  });

  app.allowRendererProcessReuse = true;

  await initializeValet();
  logger.debug(`Valet initialized`);

  await loadPreferences(ms);
  logger.debug(`Preferences loaded`);
  await startSocketServer(ms);
  logger.debug(`Socket server started`);
  await app.whenReady();
  logger.debug(`App ready`);

  await attemptAutoLogin(ms);

  onReady().catch((e) => {
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
      nodeIntegration: true,
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

  win.on("close", (ev) => {
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

main().catch((e) => {
  dialog.showErrorBox(`${app.name} failed to start`, e.stack);
  app.exit(1);
});
