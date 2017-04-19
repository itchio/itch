
import * as bluebird from "bluebird";
import * as childProcess from "child_process";
import * as StreamSplitter from "stream-splitter";
import LFTransform from "./lf-transform";

import { Cancelled } from "../tasks/errors";

import { Logger } from "./log";
import mklog from "./log";
const log = mklog("spawn");

import { EventEmitter } from "events";

interface ISpawnOpts {
  /** Command to spawn */
  command: string;

  /** Arguments */
  args: string[];

  /** Defaults to eol for the current platform ("\r\n" or "\n") */
  split?: string;

  /** If set, spawn listens to this emitter for cancellation */
  emitter?: EventEmitter;

  /** If set, called on each line of stdout */
  onToken?: (token: string) => void;

  /** If set, called on each line of stderr */
  onErrToken?: (token: string) => void;

  opts?: {
    /** Environment variables */
    env?: {
      [key: string]: string;
    },
    /** Current working directory */
    cwd?: string;
    /** shell that should be used to run a command */
    shell?: string;
  };
  logger?: Logger;

  /** if set, do not redirect stdout/stderr */
  inheritStd?: boolean;
}

interface IExecResult {
  code: number;
  out: string;
  err: string;
}

interface ISpawnInterface {
  (opts: ISpawnOpts): Promise<number>;
  assert(opts: ISpawnOpts): Promise<void>;
  exec(opts: ISpawnOpts): Promise<IExecResult>;
  getOutput(opts: ISpawnOpts): Promise<string>;
  escapePath(arg: string): string;
}

let spawn: ISpawnInterface;

spawn = async function (opts: ISpawnOpts): Promise<number> {
  const {emitter, split = "\n", onToken, onErrToken} = opts;
  let {command, args = []} = opts;

  let stdioOpts = {
    stdio: [
      "ignore", // stdin
      onToken ? "pipe" : "ignore", // stdout
      onErrToken ? "pipe" : "ignore", // stderr
    ],
  } as any;

  if (opts.inheritStd) {
    stdioOpts = {
      stdio: [],
    };
  }

  const spawnOpts = {
    ...(opts.opts || {}),
    ...stdioOpts,
  };
  log(opts, `spawning ${command} with args ${args.join(" ")}`);

  const child = childProcess.spawn(command, args, spawnOpts);
  let cancelled = false;
  let cbErr: Error = null;

  if (onToken) {
    const splitter = child.stdout.pipe(new LFTransform()).pipe(StreamSplitter(split));
    splitter.encoding = "utf8";
    splitter.on("token", (tok: string) => {
      try {
        onToken(tok);
      } catch (err) {
        cbErr = err;
      }
    });
  }

  if (onErrToken) {
    const splitter = child.stderr.pipe(new LFTransform()).pipe(StreamSplitter(split));
    splitter.encoding = "utf8";
    splitter.on("token", (tok: string) => {
      try {
        onErrToken(tok);
      } catch (err) {
        cbErr = err;
      }
    });
  }

  const promise = new bluebird((resolve, reject) => {
    let fakeCode: number;

    child.on("close", (code: number, signal: string) => {
      if (!code && fakeCode) {
        code = fakeCode;
        signal = null;
      }

      if (cbErr) {
        reject(cbErr);
      }
      if (cancelled) {
        reject(new Cancelled());
      } else {
        if (code === null && signal) {
          reject(new Error(`killed by signal ${signal}`));
        }
        resolve(code);
      }
    });
    child.on("error", reject);

    if (emitter) {
      emitter.once("cancel", (e: Error) => {
        try {
          cancelled = true;
          child.kill("SIGKILL");
        } catch (e) {
          log(opts, `error while killing ${command}: ${e.stack || e}`);
        }
      });
      emitter.once("fake-close", (e: Error) => {
        try {
          child.kill("SIGTERM");
          fakeCode = (e as any).code;
        } catch (e) {
          log(opts, `error while terminating ${command}: ${e.stack || e}`);
        }
      });
    }
  });
  const code = (await promise) as number;
  return code;
} as any;

spawn.assert = async function (opts: ISpawnOpts): Promise<void> {
  const code = await spawn(opts);
  if (code !== 0) {
    throw new Error(`spawn ${opts.command} returned code ${code}`);
  }
};

spawn.exec = async function (opts: ISpawnOpts): Promise<IExecResult> {
  let out = "";
  let err = "";

  const {onToken, onErrToken} = opts;

  const actualOpts = {
    ...opts,
    onToken: (tok: string) => {
      out += tok + "\n";
      if (onToken) { onToken(tok); }
    },
    onErrToken: (tok: string) => {
      err += tok + "\n";
      if (onErrToken) { onErrToken(tok); }
    },
  };

  const code = await spawn(actualOpts);
  return { code, out, err };
};

spawn.getOutput = async function (opts: ISpawnOpts): Promise<string> {
  const {code, err, out} = await spawn.exec(opts);
  const {command} = opts;

  if (code !== 0) {
    log(opts, `${command} failed:\n${err}`);
    throw new Error(`${command} failed with code ${code}`);
  }

  return out.trim();
};

spawn.escapePath = function (arg) {
  return `"${arg.replace(/"/g, '\\"')}"`;
};

export default spawn;
