import { app, ipcMain, session } from "electron";
import store from "main/store";
import { partitionForUser } from "common/util/partition-for-user";

export function initIpcHandlers() {
  ipcMain.handle("getGPUFeatureStatus", () => {
    return app.getGPUFeatureStatus();
  });

  ipcMain.handle("getCacheSize", () => {
    const ourSession = session.fromPartition(
      partitionForUser(String(store.getState().profile.profile.id)),
      { cache: true }
    );

    return ourSession.getCacheSize();
  });
}
