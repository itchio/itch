import { ipcRenderer, IpcRenderer, OpenDialogOptions } from "electron";

export type AsyncIpcHandlers = {
  showOpenDialog: (o: OpenDialogOptions) => Promise<string[]>;
  getUserCacheSize: (n: number) => Promise<number>;
  getGPUFeatureStatus: (x: undefined) => Promise<any>;
};

export type SyncIpcHandlers = {
  buildApp: (x: undefined) => { name: string; isPackaged: boolean };
  userAgent: (x: undefined) => string;
  getImageURL: (p: string) => string;
  getInjectURL: (p: string) => string;
  onCaptchaResponse: (r: string) => null;
  legacyMarketPath: () => string;
  mainLogPath: () => string;
};

export const emitSyncIpcEvent = <K extends keyof SyncIpcHandlers>(
  eventName: K,
  arg: Parameters<SyncIpcHandlers[K]>[0]
): ReturnType<SyncIpcHandlers[K]> => {
  return ipcRenderer.sendSync(eventName, arg);
};

export const emitAsyncIpcEvent = <K extends keyof AsyncIpcHandlers>(
  eventName: K,
  arg: Parameters<AsyncIpcHandlers[K]>[0]
): ReturnType<AsyncIpcHandlers[K]> => {
  return ipcRenderer.invoke(eventName, arg) as ReturnType<AsyncIpcHandlers[K]>;
};
