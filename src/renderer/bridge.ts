import { parse } from "url";
import { stringify } from "querystring";
import { remote } from "electron";
import { electronEnhancer } from "ftl-redux-electron-store";
import { userAgent } from "main/util/useragent";
import { getImageURL, getInjectURL } from "main/util/resources";
import { legacyMarketPath, mainLogPath } from "main/util/paths";
import { promises } from "fs";
import { cpu, graphics, osInfo } from "systeminformation";
import { call, getCaveSummary, hookLogging } from "common/butlerd/utils";
import { createRequest } from "butlerd";

export const url = {
  parse,
};

export const querystring = {
  stringify,
};

export const electron = {
  app: remote.app,
  session: remote.session,
  dialog: remote.dialog,
  BrowserWindow: remote.BrowserWindow,
};

export const useragent = {
  userAgent,
};

export const resources = {
  getImageURL,
  getInjectURL,
};

export const paths = {
  legacyMarketPath,
  mainLogPath,
};

export const reduxElectronStore = {
  electronEnhancer,
};

export const promisedFs = {
  readFile: promises.readFile,
};

export const sysinfo = {
  cpu,
  graphics,
  osInfo,
};

export const butlerd = {
  rcall: call,
  getCaveSummary,
  hookLogging,
  createRequest,
};
