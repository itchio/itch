import { Profile } from "common/butlerd/messages";
import env from "common/env";
import { PacketCreator, packets } from "common/packets";
import { app, BrowserWindow, dialog, session } from "electron";
import { prepareItchProtocol, registerItchProtocol } from "main/itch-protocol";
import { mainLogger } from "main/logger";
import { ButlerState, startButler } from "main/start-butler";
import { startWebsocketServer, WebSocketState } from "main/websocket-server";
import { PreferencesState, loadPreferences } from "main/load-preferences";
import { CurrentLocale, LocaleStrings } from "common/locales";
import { colors } from "common/colors";
import { Logger } from "common/logger";

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
  mainLogger.info(
    `${env.appName}@${app.getVersion()} on electron@${
      process.versions.electron
    } in ${env.production ? "production" : "development"}`
  );

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
  let rendererSession = session.defaultSession;
  await registerItchProtocol(mainState);

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
