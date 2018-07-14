import querystring from "querystring";

import { NET_PARTITION_NAME, NET_TIMEOUT_MS } from "common/constants/net";
import { HTTPMethod, RequestOpts, Response } from "common/types/net";

import {
  RequestError,
  RequestAborted,
  RequestTimeout,
  RequestFormattingFailure,
  RequestParsingFailure,
} from "main/net/errors";

import env from "common/env";

import { net } from "electron";
import { Readable } from "stream";
import { ItchPromise } from "common/util/itch-promise";
import { userAgent } from "common/constants/useragent";
// TODO: revert that when Electron fixes their typings.
type ActualElectronResponse = Electron.IncomingMessage & Readable;

// use chromium's net API
export async function request(
  method: HTTPMethod,
  uri: string,
  data: any = {},
  opts: RequestOpts = {}
): Promise<Response> {
  let url = uri;
  if (env.unitTests) {
    throw new Error(`refusing to do API request in unit test`);
  }

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
  req.setHeader("user-agent", userAgent());

  const p = new ItchPromise<Response>((resolve, reject) => {
    req.on("response", (inputRes: any) => {
      const res = inputRes as ActualElectronResponse;
      const response = {
        statusCode: res.statusCode,
        status: res.statusMessage,
        body: null,
        headers: res.headers,
      } as Response;

      if (opts.cb) {
        try {
          opts.cb(response);
        } catch (e) {
          reject(e);
          return;
        }
      }

      let text: any = "";

      if (opts.sink) {
        res.pipe(opts.sink());
      } else {
        res.setEncoding("utf8");
        res.on("data", function(chunk) {
          text += chunk;
        });
      }

      const contentTypeHeader = (res.headers["content-type"] || [
        "text/plain",
      ])[0];
      const contentType = /[^;]*/.exec(contentTypeHeader)![0];

      res.on("end", async () => {
        response.size = text.length;

        if (opts.sink) {
          // all good, it's up to caller to wait on promised sink
        } else if (contentType === "application/json") {
          try {
            response.body = JSON.parse(text);
          } catch (e) {
            reject(new RequestParsingFailure(e.message));
            return;
          }
        } else {
          response.body = text;
        }

        resolve(response);
      });
    });

    req.on("error", error => {
      reject(new RequestError(error.message));
    });

    req.on("abort", (error: Error) => {
      reject(new RequestAborted());
    });

    req.on("login", (authInfo, callback) => {
      // cf. https://github.com/electron/electron/blob/master/docs/api/client-request.md
      // "Providing empty credentials will cancel the request and report
      // an authentication error on the response object"
      callback(undefined as any, undefined as any);
    });

    req.on("close", () => {
      // no-op
    });

    if (!opts.sink) {
      setTimeout(() => {
        reject(new RequestTimeout());
        req.abort();
      }, NET_TIMEOUT_MS);
    }

    if (method !== "get") {
      let reqBody: string;
      try {
        if (opts.format === "json") {
          reqBody = JSON.stringify(data);
        } else {
          reqBody = querystring.stringify(data);
        }
      } catch (e) {
        reject(new RequestFormattingFailure(e.message));
      }

      req.setHeader("content-type", "application/x-www-form-urlencoded");
      req.setHeader("content-length", String(Buffer.byteLength(reqBody)));
      req.write(reqBody);
    }

    req.end();
  });

  return await p;
}
