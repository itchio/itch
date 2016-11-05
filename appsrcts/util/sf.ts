
import * as invariant from "invariant";
import { promisify, promisifyAll } from "bluebird";
import * as bluebird from "bluebird";

import {Stats} from "fs";

// let's patch all the things! Electron randomly decides to
// substitute 'fs' with their own version that considers '.asar'
// files to be read-only directories
// since itch can install applications that have .asar files, that
// won't do. we want sf to operate on actual files, so we need
// to operate some magic for various modules to use the original file system,
// not the Electron-patched one.

let fsName = "original-fs";
if (!(process.versions as any).electron) {
  // when running tests, we don't have access to original-fs
  fsName = "fs";
}

import { EventEmitter } from "events";

import * as proxyquire from "proxyquire";

let fs = Object.assign({}, require(fsName), {
  "@global": true, /* Work with transitive imports */
  "@noCallThru": true, /* Don't even require/hit electron fs */
  disableGlob: true, /* Don't ever use globs with rimraf */
});

// graceful-fs fixes a few things https://www.npmjs.com/package/graceful-fs
// notably, EMFILE, EPERM, etc.
const gracefulFs = Object.assign({}, proxyquire("graceful-fs", { fs }), {
  "@global": true, /* Work with transitive imports */
  "@noCallThru": true, /* Don't even require/hit electron fs */
});

// when proxyquired modules load, they'll require what we give
// them instead of
const stubs = {
  "fs": gracefulFs,
  "graceful-fs": gracefulFs,
};

const debugLevel = parseInt(process.env.INCENTIVE_MET, 10) || -1;
const debug = (level: number, parts: string[]) => {
  if (debugLevel < level) {
    return;
  }

  console.log(`[sf] ${parts.join(" ")}`); // tslint:disable-line:no-console
};

fs = gracefulFs;

// adds 'xxxAsync' variants of all fs functions, which we'll use
promisifyAll(fs);

// single function, callback-based, can't specify fs
const glob = promisify(proxyquire("glob", stubs) as
  (path: string, opts: any, cb: (err: any, files: string[]) => any) => void);

// single function, callback-based, can't specify fs
const mkdirp = promisify(proxyquire("mkdirp", stubs) as (path: string, cb: () => any) => void);

// single function, callback-based, doesn't accept fs
const readChunk = promisify(proxyquire("read-chunk", stubs));

// other deps
import * as path from "path";

// global ignore patterns
const ignore = [
  // on macOS, trashes exist on dmg volumes but cannot be scandir'd for some reason
  "**/.Trashes/**",
];

const concurrency = 8;

interface IFSError {
  code?: string;
  message: string;
}

/*
 * sf = backward fs, because fs itself is quite backwards
 */
const self = {
  /**
   * Returns true if file exists, false if ENOENT, throws if other error
   */
  exists: (file: string) => {
    return new bluebird((resolve, reject) => {
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
  },

  /**
   * Return utf-8 file contents as string
   */
  readFile: async (file: string): Promise<string> => {
    return await fs.readFileAsync(file, { encoding: "utf8" });
  },

  appendFile: async (file: string, contents: string, options: any): Promise<void> => {
    await self.mkdir(path.dirname(file));
    return await fs.appendFileAsync(file, contents, options);
  },

  /**
   * Writes an utf-8 string to 'file'. Creates any directory needed.
   */
  writeFile: async (file: string, contents: string): Promise<void> => {
    await self.mkdir(path.dirname(file));
    return await fs.writeFileAsync(file, contents);
  },

  /**
   * Turns a stream into a promise, resolves when
   * 'close' or 'end' is emitted, rejects when 'error' is
   */
  promised: async (stream: EventEmitter): Promise<any> => {
    invariant(typeof stream === "object", "sf.promised has object stream");

    const p = new bluebird((resolve, reject) => {
      stream.on("close", resolve);
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    return await p;
  },

  /**
   * Create each supplied directory including any necessary parent directories that
   * don't yet exist.
   *
   * If the directory already exists, do nothing.
   * Uses mkdirp: https://www.npmjs.com/package/mkdirp
   */
  mkdir: async (dir: string): Promise<any> => {
    return await mkdirp(dir);
  },

  /**
   * Rename oldPath into newPath, throws if it can't
   */
  rename: async (oldPath: string, newPath: string): Promise<void> => {
    return await fs.renameAsync(oldPath, newPath);
  },

  /**
   * Burn to the ground an entire directory and everything in it
   * Also works on file, don't bother with unlink.
   */
  wipe: async (shelter: string): Promise<void> => {
    debug(1, ["wipe", shelter]);

    let stats: Stats;
    try {
      stats = await self.lstat(shelter);
    } catch (err) {
      if (err.code === "ENOENT") {
        return;
      }
      throw err;
    }

    if (stats.isDirectory()) {
      const fileOrDirs = await self.glob("**", { cwd: shelter, dot: true, ignore });
      const dirs: string[] = [];
      const files: string[] = [];

      for (const fad of fileOrDirs) {
        const fullFad = path.join(shelter, fad);

        let fStats: Stats;
        try {
          fStats = await self.lstat(fullFad);
        } catch (err) {
          if (err.code === "ENOENT") {
            // good!
            continue;
          } else {
            throw err;
          }
        }

        if (fStats.isDirectory()) {
          dirs.push(fad);
        } else {
          files.push(fad);
        }
      }

      const unlink = async (file: string) => {
        const fullFile = path.join(shelter, file);
        await self.unlink(fullFile);
      };
      await bluebird.resolve(files).map(unlink, { concurrency });

      // remove deeper dirs first
      dirs.sort((a, b) => (b.length - a.length));

      // needs to be done in order
      for (const dir of dirs) {
        const fullDir = path.join(shelter, dir);

        debug(2, ["rmdir", fullDir]);
        await self.rmdir(fullDir);
      }

      debug(1, ["rmdir", shelter]);
      await self.rmdir(shelter);
      debug(1, ["wipe", "shelter", `done (removed ${files.length} files & ${dirs.length} directories)`]);
    } else {
      debug(1, ["unlink", shelter]);
      await self.unlink(shelter);
    }
  },

  /**
   * Promised version of isaacs' little globber
   * https://www.npmjs.com/package/glob
   */
  glob,

  globIgnore: ignore,

  /**
   * Promised version of readChunk
   * https://www.npmjs.com/package/read-chunk
   */
  readChunk,

  // Mirrors
  createReadStream: fs.createReadStream.bind(fs),
  createWriteStream: fs.createWriteStream.bind(fs),

  chmod: fs.chmodAsync.bind(fs),
  stat: fs.statAsync.bind(fs),
  lstat: fs.lstatAsync.bind(fs),
  readlink: fs.readlinkAsync.bind(fs),
  symlink: fs.symlinkAsync.bind(fs),
  rmdir: fs.rmdirAsync.bind(fs),
  unlink: fs.unlinkAsync.bind(fs),

  fsName,
  fs,
};

export default self;
