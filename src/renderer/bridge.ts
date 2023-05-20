import { parse } from "url";
import { stringify } from "querystring";
import { remote } from "electron";
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
