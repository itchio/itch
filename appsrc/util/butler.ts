
import * as ospath from "path";
import {partial} from "underscore";

import noop from "./noop";
import spawn from "./spawn";
import sf from "./sf";
import ibrew from "./ibrew";

import {EventEmitter} from "events";
import {IProgressListener, IProgressInfo, ExeArch} from "../types";

import mklog, {Logger} from "./log";
const log = mklog("butler");

const showDebug = (process.env.MY_BUTLER_IS_MY_FRIEND === "1");
const dumpAllOutput = (process.env.MY_BUTLER_IS_MY_ENEMY === "1");

interface IButlerOpts {
   emitter: EventEmitter;
   onProgress?: IProgressListener;
   logger?: Logger;
   elevate?: boolean;
}

function parseButlerStatus (opts: IButlerOpts, onerror: (err: Error) => void, token: string) {
  const {onProgress = noop} = opts;

  if (dumpAllOutput) {
    console.log(`butler stdout: ${token}`); // tslint:disable-line:no-console
  }

  let status: any;
  try {
    status = JSON.parse(token);
  } catch (err) {
    log(opts, `Couldn't parse line of butler output: ${token}`);
    return;
  }

  switch (status.type) {
    case "log": {
      if (!showDebug && status.level === "debug") {
        return;
      }
      return log(opts, `butler: ${status.message}`);
    }
    case "progress": {
      return onProgress(status as IProgressInfo);
    }
    case "error": {
      log(opts, `butler error: ${status.message}`);
      return onerror(new Error(status.message));
    }
    case "result": {
      opts.emitter.emit("result", status);
      return;
    }
    default:
      // muffin
  }
}

async function butler (opts: IButlerOpts, command: string, commandArgs: string[]): Promise<void> {
  const {emitter} = opts;
  const onerror = (e: Error) => { err = e; };
  let err = null as Error;

  let args = [ "--json", command, ...commandArgs ];

  const onToken = partial(parseButlerStatus, opts, onerror);
  const onErrToken = (line: string) => {
    log(opts, `butler stderr: ${line}`);
  };

  let realCommand = "butler";
  if (opts.elevate) {
    args = [ospath.join(ibrew.binPath(), "butler.exe"), ...args];
    realCommand = "elevate";
  }

  const code = await spawn({
    command: realCommand,
    args,
    onToken,
    onErrToken,
    emitter,
    logger: (dumpAllOutput || showDebug) ? opts.logger : null,
  });

  if (err) {
    throw err;
  }

  if (code !== 0) {
    throw new Error(`butler exited with error code ${code}`);
  }
}

interface ISizeofOpts {
  path: string;
}

interface IButlerResult {
  value: any;
}

async function sizeof (opts: ISizeofOpts): Promise<any> {
  const {path} = opts;
  const args = [path];

  let value: any;

  const emitter = new EventEmitter();
  emitter.on("result", (result: IButlerResult) => {
    value = result.value;
  });

  const butlerOpts = {
    emitter,
  };

  await butler(butlerOpts, "sizeof", args);

  return value;
}

interface IFileOpts {
  path: string;
}

interface IFileResult {
  type?: string;
  numFiles?: number;
  numDirs?: number;
  numSymlinks?: number;
  uncompressedSize?: number;
}

async function file (opts: IFileOpts): Promise<IFileResult> {
  const {path} = opts;
  const args = [path];

  let value: IFileResult = {};

  const emitter = new EventEmitter();
  emitter.on("result", (result: IButlerResult) => {
    value = result.value;
  });

  const butlerOpts = {
    emitter,
  };

  await butler(butlerOpts, "file", args);

  return value;
}

interface ICpOpts extends IButlerOpts {
  src: string;
  dest: string;
  resume?: boolean;
}

/* Copy file ${src} to ${dest} */
async function cp (opts: ICpOpts) {
  const {src, dest} = opts;
  const args = [src, dest];
  if (opts.resume) {
    args.push("--resume");
  }

  return await butler(opts, "cp", args);
}

interface IDlOpts extends IButlerOpts {
  url: string;
  dest: string;
}

/* Downloads file at ${url} to ${dest} */
async function dl (opts: IDlOpts) {
  const {url, dest} = opts;
  const args = [url, dest];

  await sf.mkdir(ospath.dirname(dest));
  return await butler(opts, "dl", args);
}

interface IApplyOpts extends IButlerOpts {
  patchPath: string;
  outPath: string;
  signaturePath: string;
  archivePath?: string;
}

/* Apply a wharf patch at ${patchPath} in-place into ${outPath}, while checking with ${signaturePath} */
async function apply (opts: IApplyOpts) {
  const {patchPath, outPath, signaturePath} = opts;
  let args = [patchPath, "--inplace", outPath, "--signature", signaturePath];

  if (opts.archivePath) {
    args = [...args, "--heal", `archive,${opts.archivePath}`];
  }

  return await butler(opts, "apply", args);
}

interface IUntarOpts extends IButlerOpts {
  archivePath: string;
  destPath: string;
}

/* Extracts tar archive ${archivePath} into directory ${destPath} */
async function untar (opts: IUntarOpts) {
  const {archivePath, destPath} = opts;
  const args = [archivePath, "-d", destPath];

  return await butler(opts, "untar", args);
}

interface IUnzipOpts extends IButlerOpts {
  archivePath: string;
  destPath: string;
}

/* Extracts zip archive ${archivePath} into directory ${destPath} */
async function unzip (opts: IUnzipOpts) {
  const {archivePath, destPath} = opts;
  const args = [archivePath, "-d", destPath];

  return await butler(opts, "unzip", args);
}

/* rm -rf ${path} */
async function wipe (path: string, opts = {} as IButlerOpts) {
  const args = [path];
  return await butler(opts, "wipe", args);
}

/* mkdir -p ${path} */
async function mkdir (path: string, opts = {} as IButlerOpts) {
  const args = [path];
  return await butler(opts, "mkdir", args);
}

/* rsync -a ${src} ${dst} */
async function ditto (src: string, dst: string, opts = {} as IButlerOpts) {
  const args = [src, dst];
  return await butler(opts, "ditto", args);
}

interface IVerifyOpts extends IButlerOpts {
  heal?: string;
}

/* Verifies ${dir} against ${signature}, heals against opts.heal if given */
async function verify (signature: string, dir: string, opts = {} as IVerifyOpts) {
  const args = [signature, dir];
  const {heal} = opts;
  if (heal) {
    args.push("--heal");
    args.push(heal);
  }
  return await butler(opts, "verify", args);
}

interface IInstallPrereqsOpts extends IButlerOpts {
  pipe?: string;
}

/* Installs prerequisites as specified by ${planPath} */
async function installPrereqs (planPath: string, opts = {} as IInstallPrereqsOpts) {
  let args = [planPath];
  const {pipe} = opts;
  if (pipe) {
    args.push("--pipe");
    args.push(pipe);
  }

  const realOpts = {
    ...opts,
    elevate: true,
  };
  return await butler(realOpts, "install-prereqs", args);
}

interface IExePropsOpts extends IButlerOpts {
  path: string;
}

export interface IExePropsResult {
  arch?: ExeArch;
}

async function exeprops (opts: IExePropsOpts): Promise<IExePropsResult> {
  const {path} = opts;
  const args = [path];

  let value: IExePropsResult;

  const emitter = new EventEmitter();
  emitter.on("result", (result: IButlerResult) => {
    value = result.value;
  });

  await butler(opts, "exeprops", args);

  return value;
}

async function sanityCheck (): Promise<boolean> {
  try {
    await spawn.assert({
      command: "butler",
      args: ["--version"],
    });
    return true;
  } catch (err) {
    return false;
  }
}

export default {
  cp, dl, apply, untar, unzip, wipe, mkdir, ditto, verify, sizeof, file, installPrereqs, sanityCheck, exeprops,
};
