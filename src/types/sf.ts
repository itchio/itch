import { Stats } from "fs";

export interface IGlobStatic {
  (path: string, opts: any, cb: (err: any, files: string[]) => any): void;
}

export interface IGlobOpts {}

export interface IReadFileOpts {
  encoding: "utf8" | null;
  flag?: string;
}

export interface IWriteFileOpts extends IReadFileOpts {
  mode?: number;
}

export interface IReadStreamOpts {
  flags?: string;
  encoding: "utf8" | "binary";
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
  end?: number;
}

export interface IWriteStreamOpts {
  flags?: string;
  defaultEncoding: "utf8" | "binary";
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

export interface IAsyncFSVariants {
  R_OK: number;
  readFileAsync: (file: string, opts: IReadFileOpts) => Promise<string>;
  writeFileAsync: (
    file: string,
    data: string | Buffer,
    opts: IWriteFileOpts,
  ) => Promise<void>;
  appendFileAsync: (
    file: string,
    data: string | Buffer,
    opts: IWriteFileOpts,
  ) => Promise<void>;
  renameAsync: (oldfile: string, newfile: string) => Promise<void>;
  chmodAsync: (file: string, mode: number) => Promise<void>;
  statAsync: (file: string) => Promise<Stats>;
  lstatAsync: (file: string) => Promise<Stats>;
  readlinkAsync: (file: string) => Promise<string>;
  symlinkAsync: (srcfile: string, dstfile: string) => Promise<string>;
  rmdirAsync: (file: string) => Promise<string>;
  unlinkAsync: (file: string) => Promise<string>;
  utimesAsync: (file: string, atime: number, mtime: number) => Promise<void>;
}

export interface IFSError {
  code?: string;
  message: string;
}
