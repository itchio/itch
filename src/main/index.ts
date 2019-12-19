import { Profile } from "common/butlerd/messages";
import env from "common/env";
import { OngoingLaunches } from "common/launches";
import { CurrentLocale, LocaleStrings } from "common/locales";
import { packets } from "common/packets";
import { partitionForApp } from "common/util/partitions";
import { app, BrowserWindow, dialog, session } from "electron";
import { envSettings } from "main/constants/env-settings";
import { DownloadsState } from "main/drive-downloads";
import { prepareItchProtocol, registerItchProtocol } from "main/itch-protocol";
import { loadPreferences, PreferencesState } from "main/load-preferences";
import { mainLogger } from "main/logger";
import { attemptAutoLogin } from "main/profile";
import { ButlerState, startButler } from "main/start-butler";
import { broadcastPacket } from "main/websocket-handler";
import { startWebSocketServer, WebSocketState } from "main/websocket-server";
import { shellBgDefault } from "renderer/theme";
import { setupShortcuts } from "main/setup-shortcuts";
import dump from "common/util/dump";

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
  downloads?: DownloadsState;
  browserWindow?: BrowserWindow;
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

  prepareItchProtocol();

  app.on("web-contents-created", (ev, wc) => {
    console.log(`Web contents created, id ${wc.id}`);
    console.log(`Host web contents, id ${wc.hostWebContents?.id}`);
    if (wc.hostWebContents?.id == ms.browserWindow?.webContents?.id) {
      setupShortcuts(ms, wc);
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
  win.on("restore", () => {
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
  logger.info(`BrowserWindow loaded, showing (${elapsed}ms after startup)`);
  win.show();

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
