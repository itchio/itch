import electron from "electron";

let app: Electron.App;
if (process.type) {
  app = electron.app || electron.remote.app;
}

export function getAppPath(): string {
  if (!app) {
    return `<app path>`;
  }
  return app.getAppPath();
}

export function getVersion(): string {
  if (!app) {
    return `<test version>`;
  }
  return app.getVersion();
}
