import { contextBridge, remote } from "electron";
import { electronEnhancer } from "ftl-redux-electron-store";
import { call } from "common/butlerd/net";
import { createRequest, Conversation } from "butlerd";
import { parse, format } from "url";
import { userAgent } from "main/util/useragent";
import { cpu, graphics, osInfo } from "systeminformation";
import { getImageURL, getInjectURL } from "main/util/resources";
import qs from "querystring";
import { legacyMarketPath, mainLogPath } from "main/util/paths";
import { promises } from "fs";
import { Logger } from "common/logger";
import { Message } from "common/helpers/bridge";
import { Store } from "common/types";
import { convertMessage } from "common/helpers/bridge";

export const mainWorldSupplement = {
  nodeUrl: { parse, format },
  electron: {
    app: remote.app,
    session: remote.session,
    dialog: remote.dialog,
    BrowserWindow: remote.BrowserWindow,
  },
  reduxElectronStore: { electronEnhancer },
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
  useragent: { userAgent },
  sysinfo: { cpu, graphics, osInfo },
  resources: { getImageURL, getInjectURL },
  querystring: {
    parse: qs.parse,
    stringify: qs.stringify,
  },
  paths: { legacyMarketPath, mainLogPath },
  promisedFs: { readFile: promises.readFile },
};

contextBridge.exposeInMainWorld("electron", mainWorldSupplement.electron);
contextBridge.exposeInMainWorld(
  "reduxElectronStore",
  mainWorldSupplement.reduxElectronStore
);
contextBridge.exposeInMainWorld("butlerd", mainWorldSupplement.butlerd);
contextBridge.exposeInMainWorld("nodeUrl", mainWorldSupplement.nodeUrl);
contextBridge.exposeInMainWorld("useragent", mainWorldSupplement.useragent);
contextBridge.exposeInMainWorld("sysinfo", mainWorldSupplement.sysinfo);
contextBridge.exposeInMainWorld("resources", mainWorldSupplement.resources);
contextBridge.exposeInMainWorld("querystring", mainWorldSupplement.querystring);
contextBridge.exposeInMainWorld("paths", mainWorldSupplement.paths);
contextBridge.exposeInMainWorld("promisedFs", mainWorldSupplement.promisedFs);

console.log("preload done");
