
import * as querystring from "querystring";

import useragent from "../../constants/useragent";
import {NET_TIMEOUT_MS} from "../../constants/net";

import {
  HTTPMethod,
  IRequestOpts, IResponse,
} from "../types";

import {
  RequestError,
  RequestTimeout,
  RequestFormattingFailure,
  RequestParsingFailure,
} from "../errors";

import * as bluebird from "bluebird";

// use fetch
export async function request (
    method: HTTPMethod,
    uri: string, 
    data: any = {},
    opts: IRequestOpts = {}): Promise<IResponse> {
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
    try {
      if (opts.format === "json") {
        body = JSON.stringify(data);
      } else {
        body = querystring.stringify(data);
      }

      headers["content-type"] = "application/x-www-form-urlencoded";
      headers["content-length"] = String(Buffer.byteLength(body));
    } catch (e) {
      throw new RequestFormattingFailure(e.message);
    }
  }

  const response = await bluebird.race([
    safeFetch(uri, {
      method,
      headers,
      body,
    }),
    timeout(),
  ]);

  try {
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
  } catch (e) {
    throw new RequestParsingFailure(e.message);
  }
}

// this function's purpose is to transform
// an error like "Fetch failed" into something
// that starts with "net::"
async function safeFetch (uri: string, opts: any): Promise<Response> {
  try {
    return fetch(uri, opts);
  } catch (e) {
    throw new RequestError(e.message);
  }
}

// this rejects after the globally set timeout
async function timeout (): Promise<Response> {
  await bluebird.delay(NET_TIMEOUT_MS);
  throw new RequestTimeout();
}
