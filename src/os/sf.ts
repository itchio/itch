import * as invariant from "invariant";
import { promisify, promisifyAll } from "bluebird";
import * as bluebird from "bluebird";

import * as fsModule from "fs";
const baseFs = require("original-fs");

import {
  IAsyncFSVariants,
  IFSError,
  IGlobStatic,
  IReadFileOpts,
  IWriteFileOpts,
} from "../types/sf";

/*
 * Let's patch all the things! Electron randomly decides to
 * substitute 'fs' with their own version that considers '.asar'
 * files to be read-only directories.
 *
 * Since itch can install applications that have .asar files, that
 * won't do.
 *
 * We want sf to operate on actual files, so we need to operate some
 * magic for various modules to use the original fs module, not the
 * asar-aware one.
 */

import { EventEmitter } from "events";
import * as proxyquire from "proxyquire";

const gracefulFsStubs = {
  fs: {
    ...baseFs,
    "@global": true /* Work with transitive imports */,
    "@noCallThru": true /* Don't even require/hit electron fs */,
    disableGlob: true /* Don't ever use globs with rimraf */,
  },
};

// graceful-fs fixes a few things https://www.npmjs.com/package/graceful-fs
// notably, EMFILE, EPERM, etc.
export const fs = ({
  ...proxyquire("graceful-fs", gracefulFsStubs),
  "@global": true /* Work with transitive imports */,
  "@noCallThru": true /* Don't even require/hit electron fs */,
} as any) as typeof fsModule & IAsyncFSVariants;

// adds 'xxxAsync' variants of all fs functions, which we'll use
promisifyAll(fs);

// when proxyquired modules load, they'll require what we give
// them instead of
const stubs = {
  fs: fs,
  "graceful-fs": fs,
};

/**
 * Promised version of isaacs' little globber
 * https://www.npmjs.com/package/glob
 * 
 * (single function, callback-based, doesn't accept fs)
 */
export const glob = promisify(proxyquire("glob", stubs) as IGlobStatic);

/**
 * Promised version of readChunk
 * https://www.npmjs.com/package/read-chunk
 * 
 * single function, callback-based, doesn't accept fs
 */
export const readChunk = promisify(proxyquire("read-chunk", stubs));

// single function, callback-based, can actually specify fs!
type Mkdirp = (path: string, opts: any) => Promise<void>;
export const mkdirp: Mkdirp = promisify(require("mkdirp")) as any;

// single function, can actually specify fs!
type Rimraf = (path: string, opts: any) => Promise<void>;
const rimraf: Rimraf = promisify(require("rimraf")) as any;

// other deps
import * as path from "path";

// global ignore patterns
export const globIgnore = [
  // on macOS, trashes exist on dmg volumes but cannot be scandir'd for some reason
  "**/.Trashes/**",
];

/**
 * Returns true if file exists, false if ENOENT, throws if other error
 */
export async function exists(file: string) {
  return new Promise((resolve, reject) => {
    const callback = (err: IFSError) => {
      if (err) {
        if (err.code === "ENOENT") {
          resolve(false);
        } else {
          reject(err);
        }
      } else {
        resolve(true);
      }
    };

    fs.access(file, fs.R_OK, callback);
  });
}

/**
 * Return file contents (defaults to utf-8)
 */
export async function readFile(
  file: string,
  opts: IReadFileOpts,
): Promise<string> {
  return await fs.readFileAsync(file, opts);
}

/**
 * Append content to a file (defaults to utf-8)
 * Creates the file and any required parent directory if they don't exist.
 */
export async function appendFile(
  file: string,
  contents: string | Buffer,
  opts?: IWriteFileOpts,
): Promise<void> {
  await mkdir(path.dirname(file));
  return await fs.appendFileAsync(file, contents, opts);
}

/**
 * Writes an utf-8 string to 'file'.
 * Creates the file and any required parent directory if they don't exist.
 */
export async function writeFile(
  file: string,
  contents: string | Buffer,
  opts: IWriteFileOpts,
): Promise<void> {
  await mkdir(path.dirname(file));
  return await fs.writeFileAsync(file, contents, opts);
}

/**
 * Turns a stream into a promise, resolves when
 * 'close' or 'end' is emitted, rejects when 'error' is
 */
export async function promised(stream: EventEmitter): Promise<any> {
  invariant(typeof stream === "object", "sf.promised has object stream");

  const p = new bluebird((resolve, reject) => {
    stream.on("close", resolve);
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return await p;
}

/**
 * Create each supplied directory including any necessary parent directories that
 * don't yet exist.
 *
 * If the directory already exists, do nothing.
 * Uses mkdirp: https://www.npmjs.com/package/mkdirp
 */
export async function mkdir(dir: string): Promise<void> {
  await mkdirp(dir, { fs: baseFs });
}

/**
 * Rename oldPath into newPath, throws if it can't
 */
export async function rename(oldPath: string, newPath: string): Promise<void> {
  return await fs.renameAsync(oldPath, newPath);
}

/**
 * Burn to the ground an entire directory and everything in it
 * Also works on file, don't bother with unlink.
 */
export async function wipe(shelter: string): Promise<void> {
  await rimraf(shelter, baseFs);
}

export async function utimes(
  file: string,
  atime: number,
  mtime: number,
): Promise<void> {
  await fs.utimesAsync(file, atime, mtime);
}

export const createReadStream = fs.createReadStream.bind(fs);
export const createWriteStream = fs.createWriteStream.bind(fs);

export const chmod = fs.chmodAsync.bind(fs);
export const stat = fs.statAsync.bind(fs);
export const lstat = fs.lstatAsync.bind(fs);
export const readlink = fs.readlinkAsync.bind(fs);
export const symlink = fs.symlinkAsync.bind(fs);
export const rmdir = fs.rmdirAsync.bind(fs);
export const unlink = fs.unlinkAsync.bind(fs);
