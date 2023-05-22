import { parse } from "url";
import { stringify } from "querystring";
import { remote } from "electron";
import { electronEnhancer } from "ftl-redux-electron-store";
import { userAgent } from "main/util/useragent";
import { getImageURL, getInjectURL } from "main/util/resources";
import { legacyMarketPath, mainLogPath } from "main/util/paths";

export const url = {
  parse,
};

export const querystring = {
  stringify,
};

export const electron = {
  app: remote.app,
  session: remote.session,
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
