import electron from "electron";

let app: Electron.App;
if (process.type) {
  app = electron.app || require("@electron/remote").app;
}

export function getAppPath(): string {
  if (!app) {
    return `<app path>`;
  }
  return app.getAppPath();
}
