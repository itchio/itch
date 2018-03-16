import * as electron from "electron";

let app: Electron.App;
if (process.type) {
  app = electron.app || electron.remote.app;
}

export function getPath(s: string): string {
  if (!app) {
    return `<path ${s}>`;
  }
  return app.getPath(s);
}

export function getVersion(): string {
  if (!app) {
    return `<test version>`;
  }
  return app.getVersion();
}
