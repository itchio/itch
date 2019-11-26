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

interface RequestCallback {
  (res: Response): void;
}

export interface RequestOpts {
  sink?: () => NodeJS.WritableStream;
  cb?: RequestCallback;
  format?: "json" | null;
}
