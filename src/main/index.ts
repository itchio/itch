import env from "common/env";
import { app, dialog, BrowserWindow } from "electron";
import { mainLogger } from "main/logger";
import { getRendererFilePath } from "common/util/resources";

async function main() {
  mainLogger.info(
    `${env.appName}@${app.getVersion()} on electron@${
      process.versions.electron
    } in ${env.production ? "production" : "development"}`
  );

  app.on("ready", onReady);
}

function onReady() {
  console.log("App is ready!");

  let win = new BrowserWindow({
    title: env.appName,
    width: 1280,
    height: 720,
  });
  win.loadURL(makeAppURL());
  win.show();
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
