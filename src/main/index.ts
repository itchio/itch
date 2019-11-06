import env from "common/env";
import { app, dialog, BrowserWindow } from "electron";
import { mainLogger } from "main/logger";
import { getRendererFilePath } from "common/util/resources";
import { Instance, Client, Endpoint } from "butlerd";
import { butlerDbPath } from "common/util/paths";
import urls from "common/constants/urls";
import { butlerUserAgent } from "common/constants/useragent";
import { messages } from "common/butlerd";
import dump from "common/util/dump";
import { ButlerdState } from "common/types";

interface MainState {
  butler: ButlerState;
}

type ButlerState = ButlerStarting | ButlerConnecting;

interface ButlerStarting {
  type: "starting";
}

interface ButlerConnecting {
  type: "up";
  instance: Instance;
  endpoint: Endpoint;
}

let mainState: MainState = {
  butler: {
    type: "starting",
  },
};

async function main() {
  mainLogger.info(
    `${env.appName}@${app.getVersion()} on electron@${
      process.versions.electron
    } in ${env.production ? "production" : "development"}`
  );

  app.on("ready", () =>
    onReady().catch(e => dialog.showErrorBox("Fatal error", e.stack))
  );
}

async function onReady() {
  await startButler();

  let win = new BrowserWindow({
    title: env.appName,
    width: 1280,
    height: 720,

    webPreferences: {
      nodeIntegration: true,
    },
  });
  win.loadURL(makeAppURL());
  win.show();

  if (env.development) {
    win.webContents.openDevTools({
      mode: "detach",
    });
  }
}

async function startButler() {
  mainLogger.info("Starting butler daemon...");
  const instance = new Instance({
    butlerExecutable: "butler",
    args: [
      "--dbpath",
      butlerDbPath(),
      "--address",
      urls.itchio,
      "--user-agent",
      butlerUserAgent(),
      "--destiny-pid",
      `${process.pid}`,
    ],
  });
  let endpoint = await instance.getEndpoint();

  const client = new Client(endpoint);
  const res = await client.call(messages.VersionGet, {});
  mainLogger.info(`Using butler ${res.versionString}`);

  mainState.butler = {
    type: "up",
    instance,
    endpoint,
  };
}

function makeAppURL(): string {
  if (env.development) {
    let port = process.env.ELECTRON_WEBPACK_WDS_PORT;
    return `http://localhost:${port}`;
  } else {
    return `file:///${getRendererFilePath("index.html")}`;
  }
}

main().catch(e => {
  dialog.showErrorBox(`${app.name} failed to start`, e.stack);
});
