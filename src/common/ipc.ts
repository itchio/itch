import { ipcRenderer, IpcRenderer, OpenDialogOptions } from "electron";

export type InjectName = "game" | "preload";

// subsets of the systeminformation results: only what the feedback
// form reports crosses the IPC boundary
export type SysinfoCpu = {
  manufacturer: string;
  brand: string;
  vendor: string;
  speed: number;
  cores: number;
};

export type SysinfoGraphics = {
  controllers: {
    model: string;
    vendor: string;
    vram: number | null;
  }[];
};

export type SysinfoOs = {
  platform: string;
  arch: string;
  distro: string;
  release: string;
  codename: string;
  logofile: string;
};

// sections that fail to probe come back as an error string
export type SysinfoReport = {
  cpu: SysinfoCpu | string;
  graphics: SysinfoGraphics | string;
  osInfo: SysinfoOs | string;
};

export type AsyncIpcHandlers = {
  showOpenDialog: (o: OpenDialogOptions) => Promise<string[]>;
  getUserCacheSize: (n: number) => Promise<number>;
  getGPUFeatureStatus: (x: undefined) => Promise<any>;
  fetchGitHubReleases: (url: string) => Promise<any>;
  sysinfoReport: (x: undefined) => Promise<SysinfoReport>;
  readTextFile: (path: string) => Promise<string>;
};

export type SyncIpcHandlers = {
  buildApp: (x: undefined) => { name: string; isPackaged: boolean };
  userAgent: (x: undefined) => string;
  getImageURL: (p: string) => string;
  getInjectURL: (p: InjectName) => string;
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
