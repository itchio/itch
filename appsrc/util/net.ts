
import {net} from "electron";

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

async function request (method: HTTPMethod, uri: string, data: any = {}): Promise<IResponse> {
  let url = uri;

  if (method as string === "GET") {
    url = `${url}?${querystring.stringify(data)}`;
  }

  const req = net.request({
    method,
    url,
  });
  req.setHeader("user-agent", useragent);

  const p = new Promise<IResponse>((resolve, reject) => {
    req.on("response", (res) => {
      // TODO: binary
      let text: any = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        text += chunk;
      });

      let contentType = res.headers["content-type"][0];

      res.on("end", () => {
        let body: any;

        if (contentType === "application/json") {
          try {
            body = JSON.parse(text);
          } catch (e) {
            reject(e);
            return;
          }
        } else {
          body = text;
        }

        resolve({
          statusCode: res.statusCode,
          status: res.statusMessage,
          body: body,
          // TODO: remove workaround when @types/electron is fixed
          headers: res.headers as any as IHeaders,
        } as IResponse);
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

  // TODO: write body
  if (method as string !== "GET") {
    const reqBody = querystring.stringify(data);

    req.setHeader("content-type", "application/x-www-form-urlencoded");
    req.setHeader("content-length", String(Buffer.byteLength(reqBody)));
    req.write(reqBody);
  }

  req.end();

  return p;
}

export default {request};
