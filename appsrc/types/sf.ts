
import {WriteStream, ReadStream, Stats} from "fs";
import * as fsModule from "fs";
import {EventEmitter} from "events";

export interface IGlobStatic {
  (path: string, opts: any, cb: (err: any, files: string[]) => any): void;
}

export interface IGlobOpts {

}

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
  writeFileAsync: (file: string, data: string | Buffer, opts: IWriteFileOpts) => Promise<void>;
  appendFileAsync: (file: string, data: string | Buffer, opts: IWriteFileOpts) => Promise<void>;
  renameAsync: (oldfile: string, newfile: string) => Promise<void>;
  chmodAsync: (file: string, mode: number) => Promise<void>;
  statAsync: (file: string) => Promise<Stats>;
  lstatAsync: (file: string) => Promise<Stats>;
  readlinkAsync: (file: string) => Promise<string>;
  symlinkAsync: (srcfile: string, dstfile: string) => Promise<string>;
  rmdirAsync: (file: string) => Promise<string>;
  unlinkAsync: (file: string) => Promise<string>;
}

export interface IFSError {
  code?: string;
  message: string;
}

export interface ISFStatic {
  exists: (file: string) => Promise<boolean>;
  readFile: (file: string, opts: IReadFileOpts) => Promise<string>;
  appendFile: (file: string, contents: string | Buffer, opts: IWriteFileOpts) => Promise<void>;
  writeFile: (file: string, contents: string | Buffer, opts: IWriteFileOpts) => Promise<void>;
  promised: (ev: EventEmitter) => Promise<any>;
  mkdir: (dir: string) => Promise<void>;
  wipe: (shelter: string) => Promise<void>;

  glob: (path: string, opts: IGlobOpts) => Promise<Array<string>>;
  globIgnore: Array<string>;

  readChunk: (file: string, position: number, length: number) => Promise<Buffer>;

  createReadStream: (file: string, opts?: IReadStreamOpts) => ReadStream;
  createWriteStream: (file: string, opts?: IWriteStreamOpts) => WriteStream;

  rename: (oldfile: string, newfile: string) => Promise<void>;
  chmod: (file: string, mode: number) => Promise<void>;
  stat: (file: string) => Promise<Stats>;
  lstat: (file: string) => Promise<Stats>;
  readlink: (file: string) => Promise<string>;
  symlink: (srcfile: string, dstfile: string) => Promise<string>;
  rmdir: (file: string) => Promise<string>;
  unlink: (file: string) => Promise<string>;

  fs: typeof fsModule;
}
