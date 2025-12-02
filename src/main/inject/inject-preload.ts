import {
  contextBridge,
  ipcRenderer,
  BrowserWindow,
  OpenDialogOptions,
} from "electron";
import { call } from "common/butlerd/net";
import { createRequest, Conversation } from "@itchio/butlerd";
import { parse, format } from "url";
import { cpu, graphics, osInfo } from "systeminformation";
import qs from "querystring";
import { promises } from "fs";
import { Logger } from "common/logger";
import { Message } from "common/helpers/bridge";
import { emitAsyncIpcEvent, emitSyncIpcEvent } from "common/ipc";
import { Store } from "common/types";
import { convertMessage } from "common/helpers/bridge";
import "@goosewobbler/electron-redux/preload";

const memo = <A>(fn: () => A): (() => A) => {
  let found: A | null = null;
  return () => {
    if (!found) {
      found = fn();
    }
    return found;
  };
};

export const mainWorldSupplement = {
  nodeUrl: { parse, format },
  electron: {
    getApp: memo(() => {
      const res = emitSyncIpcEvent("buildApp", undefined);
      // functions can't be returned over IPC, so to maintain
      // the App-like interface, we wrap the name result in
      // a function
      return {
        getName: () => res.name,
        isPackaged: res.isPackaged,
      };
    }),
    showOpenDialog: (options: OpenDialogOptions) => {
      return emitAsyncIpcEvent("showOpenDialog", options);
    },
    getUserCacheSize: (userId: number) => {
      return emitAsyncIpcEvent("getUserCacheSize", userId);
    },
    getGPUFeatureStatus: () => {
      return emitAsyncIpcEvent("getGPUFeatureStatus", undefined);
    },
  },
  butlerd: {
    rcall2: (
      s: Store,
      l: Logger,
      requestMessage: string,
      p: any,
      ms?: Message[]
    ) => {
      // we need to create a new Logger instance
      // since objects that pass through the contextBridge
      // are stripped of their prototype
      const rePrototypedLogger = new Logger(l.sink, l.name);
      const rePrototypedRequestCreator = createRequest<any, any>(
        requestMessage
      );
      // we need to convert the messages into their function
      // equivalent on this side of the bridge. This allows us
      // keep the Conversation object in the main process.
      let setup: ((Conversation) => void) | null = null;
      if (ms) {
        setup = (convo: Conversation) => {
          for (const m of ms) {
            convertMessage(m)(convo);
          }
        };
      }
      return call(s, rePrototypedLogger, rePrototypedRequestCreator, p, setup);
    },
    createRequest,
  },
  useragent: {
    userAgent: memo(() => {
      return emitSyncIpcEvent("userAgent", undefined);
    }),
  },
  sysinfo: { cpu, graphics, osInfo },
  resources: {
    getImageURL: (path: string): string => {
      return emitSyncIpcEvent("getImageURL", path);
    },
    getInjectURL: (path: string): string => {
      return emitSyncIpcEvent("getInjectURL", path);
    },
  },
  querystring: {
    parse: qs.parse,
    stringify: qs.stringify,
  },
  paths: {
    legacyMarketPath: memo((): string => {
      return emitSyncIpcEvent("legacyMarketPath", undefined);
    }),
    mainLogPath: memo((): string => {
      return emitSyncIpcEvent("mainLogPath", undefined);
    }),
  },
  promisedFs: { readFile: promises.readFile },
};

contextBridge.exposeInMainWorld("electron", mainWorldSupplement.electron);
contextBridge.exposeInMainWorld("butlerd", mainWorldSupplement.butlerd);
contextBridge.exposeInMainWorld("nodeUrl", mainWorldSupplement.nodeUrl);
contextBridge.exposeInMainWorld("useragent", mainWorldSupplement.useragent);
contextBridge.exposeInMainWorld("sysinfo", mainWorldSupplement.sysinfo);
contextBridge.exposeInMainWorld("resources", mainWorldSupplement.resources);
contextBridge.exposeInMainWorld("querystring", mainWorldSupplement.querystring);
contextBridge.exposeInMainWorld("paths", mainWorldSupplement.paths);
contextBridge.exposeInMainWorld("promisedFs", mainWorldSupplement.promisedFs);

console.log("preload done");
