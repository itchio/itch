
import {promisify} from "bluebird";
import * as needle from "needle";
import {INeedleRequest, INeedleCallback} from "needle";

import {EventEmitter} from "events";

import useragent from "../constants/useragent";

export const proxy = process.env.http_proxy || process.env.HTTP_PROXY;
export const proxySource = proxy ? "env" : "direct";

function withProxy (options: any): any {
  return Object.assign({}, options, {
    proxy: module.exports.proxy,
  });
}

needle.defaults({
  proxy,
  user_agent: useragent,
});

const offlineErr = new Error("Offline mode active!");
(offlineErr as any).code = "ENOTFOUND";

function isOffline () {
  const store = require("../store").default;
  if (store) {
    return store.getState().preferences.offlineMode;
  } else {
    return false;
  }
}

function closeConnection (callback: INeedleCallback) {
  if (callback) {
    callback(offlineErr, null);
  }

  const out = new EventEmitter();
  setImmediate(() => out.emit("end", offlineErr));
  return out;
}

export function head (uri: string, options: any, callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return needle.head(uri, withProxy(options), callback);
}

export const headAsync = promisify(head);

export function get (uri: string, options: any, callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return needle.get(uri, withProxy(options), callback);
}

export const getAsync = promisify(get);

export function post (uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return needle.post(uri, data, withProxy(options), callback);
}

export const postAsync = promisify(post);

export function put (uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return needle.put(uri, data, withProxy(options), callback);
}

export const putAsync = promisify(put);

export function patch (uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return needle.patch(uri, data, withProxy(options), callback);
}

export const patchAsync = promisify(patch);

export function deleteRequest (uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return (needle as any)["delete"](uri, data, withProxy(options), callback);
}

export const deleteRequestAsync = promisify(deleteRequest);

type INeedleMethod = "HEAD" | "GET" | "POST"  | "PUT" | "PATCH" | "DELETE"

export function request (method: INeedleMethod, uri: string, data: any, options: any,
                         callback: INeedleCallback): INeedleRequest {
  if (isOffline()) { return closeConnection(callback); }
  return needle.request(method, uri, data, withProxy(options), callback);
}

export const requestAsync = promisify(request);
