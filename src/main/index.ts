import env from "common/env";
import { app, BrowserWindow, dialog, protocol, session } from "electron";
import { mainLogger } from "main/logger";
import { ButlerState, startButler } from "main/start-butler";
import { startWebsocketServer, WebSocketState } from "main/websocket-server";
import { Packet } from "packets";
import { prepareItchProtocol, registerItchProtocol } from "main/itch-protocol";
import { Profile } from "common/butlerd/messages";

export interface MainState {
  butler?: ButlerState;
  websocket?: WebSocketState;
  profile?: Profile;
}

let mainState: MainState = {};

export function broadcastPacket<T>(p: Packet<T>) {
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

  let win = new BrowserWindow({
    title: env.appName,
    width: 1280,
    height: 720,
    webPreferences: {
      session: rendererSession,
      webviewTag: true,
    },
  });
  win.setMenu(null);
  win.setMenuBarVisibility(false);
  win.loadURL("itch://app");
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
