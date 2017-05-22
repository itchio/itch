
import {net} from "electron";

import env from "../env";

import * as querystring from "querystring";
import {isEmpty} from "underscore";

import useragent from "../constants/useragent";

import sf from "../os/sf";
import * as humanize from "humanize-plus";
import rootLogger, {Logger} from "../logger";
const logger = rootLogger.child({name: "net"});

import * as ospath from "path";

import {indexBy, filter, map} from "underscore";

type HTTPMethod = "head" | "get" | "post"  | "put" | "patch" | "delete";

export interface IHeaders {
  [key: string]: string[];
}

export interface IResponse {
  statusCode: number;
  status: string;
  body: any;
  headers: IHeaders;
}

export class RequestError extends Error {
  constructor (message = "Request error") {
    super(message);
  }
}

export class RequestTimeout extends RequestError {
  constructor () {
    super("Request timed out");
  }
}

export class RequestAborted extends RequestError {
  constructor () {
    super("Request aborted");
  }
}

import {WriteStream} from "fs";

export interface IRequestCallback {
  (res: IResponse): void;
}

export interface IRequestOpts {
  sink?: WriteStream;
  cb?: IRequestCallback;
  format?: "json" | null;
}

// this session doesn't cache - see preboot for setup
export const NET_PARTITION_NAME = "itch-zone";

type RequestFunc = (method: HTTPMethod, uri: string, data: any, opts?: IRequestOpts) => Promise<IResponse>;

let request: RequestFunc;

if (process.type === "renderer") {
  // use fetch
  request = async function (method: HTTPMethod,
                            uri: string, 
                            data: any = {},
                            opts: IRequestOpts = {}): Promise<IResponse> {
    if (env.name === "test") {
      throw new Error("refusing to perform HTTP request in test");
    }
    let url = uri;

    if (method === "get") {
      const query = querystring.stringify(data);
      if (query !== "") {
        url = `${url}?${query}`;
      }
    }

    let body;
    let headers: any = {
      "user-agent": useragent,
    };

    if (method === "post") {
      if (opts.format === "json") {
        body = JSON.stringify(data);
      } else {
        body = querystring.stringify(data);
      }

      headers["content-type"] = "application/x-www-form-urlencoded";
      headers["content-length"] = String(Buffer.byteLength(body));
    }

    const p = fetch(uri, {
      method,
      headers,
      body,
    });
    const response = await p;

    const contentTypeHeader = response.headers.get("content-type") || "text/plain";
    const contentType = /[^;]*/.exec(contentTypeHeader)[0];

    let responseBody;
    if (contentType === "application/json") {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // FIXME: reduce waste
    const responseHeaders = {} as any;
    response.headers.forEach((key, val) => {
      if (!responseHeaders[key]) {
        responseHeaders[key] = [];
      }
      responseHeaders[key].push(val);
    });

    return {
      statusCode: response.status,
      status: response.statusText,
      body: responseBody,
      headers,
    };
  };
} else {
  // use chromium's net API
  request = async function (method: HTTPMethod,
                            uri: string, 
                            data: any = {},
                            opts: IRequestOpts = {}): Promise<IResponse> {
    if (env.name === "test") {
      throw new Error("refusing to perform HTTP request in test");
    }
    let url = uri;

    if (method === "get") {
      const query = querystring.stringify(data);
      if (query !== "") {
        url = `${url}?${query}`;
      }
    }

    const req = net.request({
      method,
      url,
      partition: NET_PARTITION_NAME,
    });
    req.setHeader("user-agent", useragent);

    const p = new Promise<IResponse>((resolve, reject) => {
      req.on("response", (res) => {
        const response = {
          statusCode: res.statusCode,
          status: res.statusMessage,
          body: null,
          headers: res.headers,
        } as IResponse;

        if (opts.cb) {
          opts.cb(response);
        }

        let text: any = "";

        if (opts.sink) {
          res.pipe(opts.sink);
        } else {
          res.setEncoding("utf8");
          res.on("data", function (chunk) {
            text += chunk;
          });
        }

        const contentTypeHeader = (res.headers["content-type"] || ["text/plain"])[0];
        const contentType = /[^;]*/.exec(contentTypeHeader)[0];

        res.on("end", async () => {
          if (opts.sink) {
            // all good, it's up to caller to wait on promised sink
          } else if (contentType === "application/json") {
            try {
              response.body = JSON.parse(text);
            } catch (e) {
              reject(e);
              return;
            }
          } else {
            response.body = text;
          }

          resolve(response);
        });
      });

      req.on("error", (error) => {
        reject(new RequestError(error.message));
      });

      req.on("abort", (error: Error) => {
        reject(new RequestAborted());
      });

      req.on("login", (authInfo, callback) => {
        // cf. https://github.com/electron/electron/blob/master/docs/api/client-request.md
        // "Providing empty credentials will cancel the request and report
        // an authentication error on the response object"
        callback();
      });

      req.on("close", () => {
        // no-op
      });
      
      if (!opts.sink) {
        const timeout = 10 * 1000;
        setTimeout(() => {
          reject(new RequestTimeout());
          req.abort();
        }, timeout);
      }

      if (method !== "get") {
        let reqBody: string;
        if (opts.format === "json") {
          reqBody = JSON.stringify(data);
        } else {
          reqBody = querystring.stringify(data);
        }

        req.setHeader("content-type", "application/x-www-form-urlencoded");
        req.setHeader("content-length", String(Buffer.byteLength(reqBody)));
        req.write(reqBody);
      }

      req.end();
    });

    return await p;
  };
}

interface ILoggerOpts {
  logger: Logger;
}

export type ChecksumAlgo = "SHA256" | "SHA1";

export interface IChecksums {
  [path: string]: {
    path: string;
    hash: string;
  };
}

/**
 * Download to file without using butler
 */
export async function downloadToFile (opts: ILoggerOpts, url: string, file: string): Promise<void> {
  // tslint:disable-next-line
  const {logger} = opts;

  const dir = ospath.dirname(file);
  try {
    await sf.mkdir(dir);
  } catch (e) {
    logger.error(`Could not create ${dir}: ${e.message}`);
  }

  const sink = sf.createWriteStream(file, {
    flags: "w",
    mode: 0o777,
    defaultEncoding: "binary",
  });

  let totalSize = 0;

  await request("get", url, {}, {
    sink,
    cb: (res) => {
      const contentLengthHeader = res.headers["content-length"];
      if (!isEmpty(contentLengthHeader)) {
        totalSize = parseInt(contentLengthHeader[0], 10);
      }
    },
  });
  await sf.promised(sink);

  const stats = await sf.lstat(file);
  logger.info(`downloaded ${humanize.fileSize(stats.size)} / ${humanize.fileSize(totalSize)} (${stats.size} bytes)`);

  if (totalSize !== 0 && stats.size !== totalSize) {
    throw new Error(`download failed (short size) for ${url}`);
  }
}

export async function getChecksums (opts: ILoggerOpts, basePath: string, algo: ChecksumAlgo): Promise<IChecksums> {
  const url = `${basePath}/${algo}SUMS`;
  // bust cloudflare cache
  const res = await request("get", url, {t: Date.now()});

  if (res.statusCode !== 200) {
    logger.warn(`couldn't get hashes: HTTP ${res.statusCode}, for ${url}`);
    return null;
  }

  const lines = (res.body.toString("utf8") as string).split("\n");

  return indexBy(filter(
    map(lines, (line) => {
      const matches = /^(\S+) [ \*](\S+)$/.exec(line);
      if (matches) {
        return {
          hash: matches[1],
          path: matches[2],
        };
      }
    }),
    (x) => !!x,
  ), "path");
}

interface IEnsureChecksumArgs {
  algo: ChecksumAlgo;
  expected: string;
  file: string;
}

export async function ensureChecksum (
    opts: ILoggerOpts, args: IEnsureChecksumArgs): Promise<void> {
  const {algo, file} = args;
  const name = ospath.basename(file);

  if (!args.expected) {
    logger.info(`${name}: no ${algo} checksum, skipping`);
    return;
  }
  const expected = args.expected.toLowerCase();

  logger.info(`${name}: expected ${algo}: ${expected}`);
  const h = require("crypto").createHash(algo.toLowerCase());
  // null encoding = raw buffer (e.g. not utf-8)
  const fileContents = await sf.readFile(file, { encoding: null });
  h.update(fileContents);
  const actual = h.digest("hex");
  logger.info(`${name}:   actual ${algo}: ${actual}`);

  if (expected !== actual) {
    throw new Error(`corrupted file ${name}: expected ${expected}, got ${actual}`);
  }
  logger.info(`${name}: ${algo} checks out!`);
}

export default {request, downloadToFile, getChecksums, ensureChecksum};
