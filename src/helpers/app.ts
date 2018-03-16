import * as electron from "electron";

let app: Electron.App;
if (process.env.NODE_ENV !== "test") {
  app = electron.app || electron.remote.app;
}

export function getPath(s: string): string {
  if (process.env.NODE_ENV === "test") {
    return `<path ${s}>`;
  }
  return app.getPath(s);
}

export function getVersion(): string {
  if (process.env.NODE_ENV === "test") {
    return `<test version>`;
  }
  return app.getVersion();
}
