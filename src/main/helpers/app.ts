import electron from "electron";

let app: Electron.App;
if (process.type) {
  app =
    electron.app ||
    (() => {
      throw new Error("fail in app.ts");
    })();
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
