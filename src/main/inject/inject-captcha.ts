import { contextBridge } from "electron";
import { emitSyncIpcEvent } from "common/ipc";

contextBridge.exposeInMainWorld("onCaptcha", function (response: string) {
  emitSyncIpcEvent("onCaptchaResponse", response);
});
