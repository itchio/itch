import { parse } from "url";
import { stringify } from "querystring";
import { remote } from "electron";

export const url = {
  parse,
};

export const querystring = {
  stringify,
};

export const electron = {
  app: remote.app,
};
