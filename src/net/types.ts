export type HTTPMethod = "head" | "get" | "post" | "put" | "patch" | "delete";

export type RequestFunc = (
  method: HTTPMethod,
  uri: string,
  data: any,
  opts?: IRequestOpts
) => Promise<IResponse>;

export interface IHeaders {
  [key: string]: string[];
}

export interface IResponse {
  statusCode: number;
  status: string;
  body: any;
  size: number;
  headers: IHeaders;
}

import { WriteStream } from "fs";

interface IRequestCallback {
  (res: IResponse): void;
}

export interface IRequestOpts {
  sink?: () => WriteStream;
  cb?: IRequestCallback;
  format?: "json" | null;
}
