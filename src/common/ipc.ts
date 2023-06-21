import { IpcRenderer, OpenDialogOptions } from "electron";

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
  legacyMarketPath: () => string;
  mainLogPath: () => string;
};
