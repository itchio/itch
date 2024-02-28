import { contextBridge } from "electron";
import { emitSyncIpcEvent } from "common/ipc";
import "@goosewobbler/electron-redux/preload";

contextBridge.exposeInMainWorld("onCaptcha", function (response: string) {
  emitSyncIpcEvent("onCaptchaResponse", response);
});
