
import {net} from "../electron";

import * as querystring from "querystring";

import useragent from "../constants/useragent";

type HTTPMethod = "head" | "get" | "post"  | "put" | "patch" | "delete"

export interface IHeaders {
  [key: string]: string[];
}

export interface IResponse {
  statusCode: number;
  status: string;
  body: any;
  headers: IHeaders;
}

export class RequestAbortedError extends Error {
  constructor () {
    super("Request aborted!");
  }
}

export class RequestError extends Error {
  constructor () {
    super("Request error!");
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

async function request (method: HTTPMethod, uri: string, data: any = {}, opts: IRequestOpts = {}): Promise<IResponse> {
  let url = uri;

  if (method as string === "GET") {
    const query = querystring.stringify(data);
    if (query !== "") {
      url = `${url}?${query}`;
    }
  }

  const req = net.request({
    method,
    url,
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

      const contentTypeHeader = res.headers["content-type"][0];
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
      console.log("Request error: ", error); // tslint:disable-line:no-console
      reject(new RequestError());
    });

    req.on("abort", () => {
      reject(new RequestAbortedError());
    });
  });

  if (method as string !== "GET") {
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

  return p;
}

export default {request};
