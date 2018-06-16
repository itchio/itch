export type HTTPMethod = "head" | "get" | "post" | "put" | "patch" | "delete";

export type RequestFunc = (
  method: HTTPMethod,
  uri: string,
  data: any,
  opts?: RequestOpts
) => Promise<Response>;

export interface Headers {
  [key: string]: string[];
}

export interface Response {
  statusCode: number;
  status: string;
  body: any;
  size: number;
  headers: Headers;
}

import { WriteStream } from "fs";

interface RequestCallback {
  (res: Response): void;
}

export interface RequestOpts {
  sink?: () => WriteStream;
  cb?: RequestCallback;
  format?: "json" | null;
}
