import { Profile } from "common/butlerd/messages";
import { colors } from "common/colors";
import env from "common/env";
import { OngoingLaunches } from "common/launches";
import { CurrentLocale, LocaleStrings } from "common/locales";
import { PacketCreator, packets } from "common/packets";
import { app, BrowserWindow, dialog, session } from "electron";
import { prepareItchProtocol, registerItchProtocol } from "main/itch-protocol";
import { loadPreferences, PreferencesState } from "main/load-preferences";
import { mainLogger } from "main/logger";
import { ButlerState, startButler } from "main/start-butler";
import { startWebsocketServer, WebSocketState } from "main/websocket-server";
import { partitionForApp } from "common/util/partitions";

export interface LocalesConfig {
  locales: {
    value: string;
    label: string;
  }[];
}

export interface MainState {
  butler?: ButlerState;
  websocket?: WebSocketState;
  profile?: Profile;
  webview: WebviewState;
  preferences?: PreferencesState;
  localesConfig?: LocalesConfig;
  localeState?: LocaleState;
  ongoingLaunches: OngoingLaunches;
}

export interface LocaleState {
  englishStrings: LocaleStrings;
  current: CurrentLocale;
}

export interface WebviewState {
  history: string[];
  currentIndex: number;
}

let mainState: MainState = {
  webview: {
    history: ["itch://library"],
    currentIndex: 0,
  },
  ongoingLaunches: {},
};

export function broadcastPacket<T>(pc: PacketCreator<T>, payload: T) {
  let p = pc(payload);

  let ws = mainState.websocket;
  if (ws) {
    let serialized = JSON.stringify(p);
    for (const s of ws.sockets) {
      s.send(serialized);
    }
  } else {
    mainLogger.warn(`Can't broadcast yet, websocket isn't up`);
  }
}

async function main() {
  {
    let appInfo = `${env.appName}@${app.getVersion()}`;
    let electronInfo = `electron@${process.versions.electron}`;
    mainLogger.info(`${appInfo} on ${electronInfo} in ${env.name}`);
  }

  prepareItchProtocol();

  // 🎃🎃🎃
  // see https://github.com/electron/electron/issues/20127
  app.allowRendererProcessReuse = true;

  let promises: Promise<void>[] = [];
  promises.push(
    new Promise((resolve, reject) => {
      app.on("ready", resolve);
    })
  );
  promises.push(loadPreferences(mainState));
  promises.push(startButler(mainState));
  promises.push(startWebsocketServer(mainState));
  await Promise.all(promises);
  mainLogger.info(`butler & websocket started, app is ready`);

  onReady().catch(e => {
    dialog.showErrorBox("Fatal error", e.stack);
    app.exit(2);
  });
}

async function onReady() {
  const partition = partitionForApp();
  await registerItchProtocol(mainState, partition);
  let rendererSession = session.fromPartition(partition);

  mainLogger.info(`Setting proxy rules...`);
  let beforeProxy = Date.now();
  rendererSession
    .setProxy({
      pacScript: null as any,
      proxyRules: null as any,
      proxyBypassRules: "<local>",
    })
    .then(() => {
      mainLogger.info(
        `Proxy rules were set. Took ${Date.now() - beforeProxy} ms.`
      );
    });

  let win = new BrowserWindow({
    title: env.appName,
    width: 1280,
    height: 720,
    backgroundColor: colors.baseBackground,
    show: false,
    webPreferences: {
      session: rendererSession,
      webviewTag: true,
    },
  });
  win.setMenu(null);
  win.setMenuBarVisibility(false);
  win.webContents.addListener("will-navigate", (ev, url) => {
    ev.preventDefault();
    console.log(`prevented ${url} navigation, broadcasting instead`);
    broadcastPacket(packets.navigate, {
      url,
    });
  });
  await win.loadURL("itch://app");
  mainLogger.info(`BrowserWindow loaded, showing`);
  win.show();

  if (env.development || process.env.DEVTOOLS === "1") {
    win.webContents.openDevTools({
      mode: "detach",
    });
  }
}

main().catch(e => {
  dialog.showErrorBox(`${app.name} failed to start`, e.stack);
  app.exit(1);
});
