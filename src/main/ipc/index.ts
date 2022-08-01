import { app, ipcMain } from "electron";

export function initIpcHandlers() {
  ipcMain.handle("getGPUFeatureStatus", () => {
    return app.getGPUFeatureStatus();
  });
}
