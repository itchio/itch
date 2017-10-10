import * as ospath from "path";
import { first } from "underscore";

import spawn from "../os/spawn";
import * as sf from "../os/sf";

import { MinimalContext } from "../context";
import { IProgressInfo, ExeArch } from "../types";

import { Logger, devNull } from "../logger";
import urls from "../constants/urls";
import { formatExitCode } from "../format/exit-code";

import { IButlerSender, IButlerSendable } from "./butler/sendables";

const showDebug = process.env.MY_BUTLER_IS_MY_FRIEND === "1";
const dumpAllOutput = process.env.MY_BUTLER_IS_MY_ENEMY === "1";

export interface IButlerResult {
  value: any;
}

export interface IButlerRequest {
  operation: string;
  request: string;
  params: any;
}

type IResultListener = (result: IButlerResult) => void;
type IRequestListener = (request: IButlerRequest) => void;
type IValueListener = (value: any) => void;
type ISenderReadyListener = (sender: IButlerSender) => void;

export interface IButlerOpts {
  logger: Logger;
  ctx: MinimalContext;
  onSenderReady?: ISenderReadyListener;
  onRequest?: IRequestListener;
  onResult?: IResultListener;
  onValue?: IValueListener;
  elevate?: boolean;
}

type IErrorListener = (err: Error) => void;

interface IParseButlerStatusOpts {
  onError: IErrorListener;
  onResult: IResultListener;
  onRequest: IRequestListener;
  ctx: MinimalContext;
  logger: Logger;
}

function parseButlerStatus(opts: IParseButlerStatusOpts, token: string) {
  const { ctx, onError, onResult, onRequest, logger } = opts;

  if (dumpAllOutput) {
    logger.debug(`butler stdout: ${token}`);
  }

  let status: any;
  try {
    status = JSON.parse(token);
  } catch (err) {
    logger.warn(`Couldn't parse line of butler output: ${token}`);
    return;
  }

  switch (status.type) {
    case "log": {
      if (!showDebug && status.level === "debug") {
        return;
      }
      return logger.info(`butler: ${status.message}`);
    }
    case "progress": {
      return ctx.emitProgress(status as IProgressInfo);
    }
    case "error": {
      logger.error(`butler error: ${status.message}`);
      return onError(new Error(status.message));
    }
    case "result": {
      onResult(status);
      return;
    }
    case "request": {
      onRequest(status.value);
      return;
    }
    default:
    // muffin
  }
}

async function butler<T>(
  opts: IButlerOpts,
  command: string,
  commandArgs: string[]
): Promise<T> {
  const { ctx, logger } = opts;

  let value: any = null;
  let err = null as Error;

  let args = ["--address", urls.itchio, "--json", command, ...commandArgs];

  const parseStatusOpts = {
    onError: (e: Error) => {
      err = e;
    },
    onResult: (result: IButlerResult) => {
      value = result.value;
      if (opts.onResult) {
        opts.onResult(result);
      }
      if (opts.onValue) {
        opts.onValue(value);
      }
    },
    onRequest: (request: IButlerRequest) => {
      if (opts.onRequest) {
        opts.onRequest(request);
      }
    },
    ctx,
    logger,
  };

  const onToken = (line: string) => {
    parseButlerStatus(parseStatusOpts, line);
  };
  const onErrToken = (line: string) => {
    logger.info(`butler stderr: ${line}`);
  };

  if (opts.elevate) {
    args = ["--elevate", ...args];
  }

  const code = await spawn({
    command: "butler",
    args,
    onToken,
    onErrToken,
    onStdinReady: stdin => {
      if (opts.onSenderReady) {
        const sender: IButlerSender = {
          send: (payload: IButlerSendable) => {
            const json = JSON.stringify(payload);
            stdin.cork();
            stdin.write(json);
            stdin.write("\n");
            process.nextTick(() => stdin.uncork());
          },
        };
        opts.onSenderReady(sender);
      }
    },
    ctx,
    logger: dumpAllOutput || showDebug ? opts.logger : devNull,
  });

  if (err) {
    throw err;
  }

  if (code !== 0) {
    throw new Error(`butler exit code ${formatExitCode(code)}`);
  }

  return value;
}

interface IFileOpts extends IButlerOpts {
  path: string;
}

interface IFileResult extends IButlerOpts {
  type?: string;
  numFiles?: number;
  numDirs?: number;
  numSymlinks?: number;
  uncompressedSize?: number;
}

async function file(opts: IFileOpts): Promise<IFileResult> {
  const { path } = opts;
  const args = [path];
  return await butler<IFileResult>(opts, "file", args);
}

interface ICpOpts extends IButlerOpts {
  src: string;
  dest: string;
  resume?: boolean;
}

/* Copy file ${src} to ${dest} */
async function cp(opts: ICpOpts) {
  const { src, dest } = opts;
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
async function dl(opts: IDlOpts) {
  const { url, dest } = opts;
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
async function apply(opts: IApplyOpts) {
  const { patchPath, outPath, signaturePath } = opts;
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
async function untar(opts: IUntarOpts) {
  const { archivePath, destPath } = opts;
  const args = [archivePath, "-d", destPath];

  return await butler(opts, "untar", args);
}

export interface IUnzipOpts extends IButlerOpts {
  archivePath: string;
  destPath: string;
}

export interface IUnzipResult {
  files: string[];
}

interface IUnzipValue {
  type: "entry";
  path: string;
}

/* Extracts zip archive ${archivePath} into directory ${destPath} */
async function unzip(opts: IUnzipOpts): Promise<IUnzipResult> {
  const { archivePath, destPath } = opts;
  const args = [archivePath, "-d", destPath];

  const files = [];
  if (!opts.onValue) {
    opts = {
      ...opts,
      onValue: (val: IUnzipValue) => {
        if (val.type === "entry") {
          files.push(val.path);
        }
      },
    };
  }

  await butler(opts, "unzip", args);
  return { files };
}

interface IWalkOpts extends IButlerOpts {
  dir: string;
}

export interface IWalkResult {
  files: string[];
}

interface IWalkValue {
  type: "entry";
  path: string;
}

/* Lists all files contained in a folder */
async function walk(opts: IWalkOpts): Promise<IWalkResult> {
  const { dir } = opts;
  const args = [dir];

  const files = [];
  if (!opts.onValue) {
    opts = {
      ...opts,
      onValue: (val: IWalkValue) => {
        if (val.type === "entry") {
          files.push(val.path);
        }
      },
    };
  }

  await butler(opts, "walk", args);
  return { files };
}

/* rm -rf ${path} */
async function wipe(path: string, opts: IButlerOpts) {
  const args = [path];
  return await butler(opts, "wipe", args);
}

interface ICleanOpts extends IButlerOpts {
  planPath: string;
}

/* Apply a clean plan (remove a list of files) */
async function clean(opts: ICleanOpts) {
  const { planPath } = opts;
  const args = [planPath];

  await butler(opts, "clean", args);
}

/* mkdir -p ${path} */
async function mkdir(path: string, opts: IButlerOpts) {
  const args = [path];
  return await butler(opts, "mkdir", args);
}

/* rsync -a ${src} ${dst} */
async function ditto(src: string, dst: string, opts: IButlerOpts) {
  const args = [src, dst];
  return await butler(opts, "ditto", args);
}

interface IVerifyOpts extends IButlerOpts {
  heal?: string;
}

/* Verifies ${dir} against ${signature}, heals against opts.heal if given */
async function verify(signature: string, dir: string, opts: IVerifyOpts) {
  const args = [signature, dir];
  const { heal } = opts;
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
async function installPrereqs(
  planPath: string,
  opts = {} as IInstallPrereqsOpts
) {
  let args = [planPath];

  return await butler(opts, "install-prereqs", args);
}

interface IExePropsOpts extends IButlerOpts {
  path: string;
}

export interface IExePropsResult {
  arch?: ExeArch;
}

async function exeprops(opts: IExePropsOpts): Promise<IExePropsResult> {
  const { path } = opts;
  const args = [path];
  return await butler<IExePropsResult>(opts, "exeprops", args);
}

interface IElfPropsOpts extends IButlerOpts {
  path: string;
}

export interface IElfPropsResult {
  arch?: ExeArch;
}

async function elfprops(opts: IElfPropsOpts): Promise<IElfPropsResult> {
  const { path } = opts;
  const args = [path];
  return await butler<IElfPropsResult>(opts, "elfprops", args);
}

export interface IConfigureResult {
  basePath: string;
  totalSize: number;
  candidates?: ICandidate[];
}

export type Flavor =
  | "linux"
  | "macos"
  | "app-macos"
  | "windows"
  | "script"
  | "windows-script"
  | "jar"
  | "html"
  | "love";

export type Arch = "386" | "amd64";

export interface ICandidate {
  path: string;
  depth: number;
  flavor: Flavor;
  arch?: Arch;
  size: number;
  windowsInfo?: {
    gui?: boolean;
    installerType?: string;
  };
  scriptInfo?: {
    interpreter?: string;
  };
}

export interface IConfigureOpts extends IButlerOpts {
  path: string;
  osFilter?: string;
  archFilter?: string;
  noFilter?: boolean;
}

async function configure(opts: IConfigureOpts): Promise<IConfigureResult> {
  const { path, logger } = opts;
  let args = [path];
  if (opts.osFilter) {
    args = [...args, "--os-filter", opts.osFilter];
  }
  if (opts.archFilter) {
    args = [...args, "--arch-filter", opts.archFilter];
  }
  if (opts.noFilter) {
    args = [...args, "--no-filter"];
  }

  logger.info(`launching butler with args: ${JSON.stringify(args)}`);
  return await butler<IConfigureResult>(opts, "configure", args);
}

async function configureSingle(opts: IConfigureOpts): Promise<ICandidate> {
  const result = await configure(opts);
  if (result) {
    return first(result.candidates);
  }

  return null;
}

interface IMsiInfoOpts extends IButlerOpts {
  /** Which msi file to probe for infos */
  file: string;
}

interface IMsiInfoResult {
  /** An UUID associated with the product this MSI installs */
  productCode: string;

  /**
   * Absent: The product is installed for a different user.
   * Advertised: The product is advertised but not installed.
   * Default: The product is installed for the current user.
   * InvalidArg: An invalid parameter was passed to the function.
   * Unknown: The product is neither advertised nor installed
   * See https://msdn.microsoft.com/en-us/library/windows/desktop/aa370363(v=vs.85).aspx
   */
  installState: string;
}

async function msiInfo(opts: IMsiInfoOpts): Promise<IMsiInfoResult> {
  const { file } = opts;
  return await butler<IMsiInfoResult>(opts, "msi-info", [file]);
}

export interface IMsiInstallOpts extends IButlerOpts {
  /** Which msi file to install */
  file: string;

  /** Where the MSI should be installed. Specifying this attempts an unprivileged install */
  target: string;
}

export interface IWindowsInstallerError {
  /** See https://msdn.microsoft.com/en-us/library/windows/desktop/aa372835(v=vs.85).aspx */
  code: number;

  /** Textual description, might be localized? */
  text: string;
}

async function msiInstall(opts: IMsiInstallOpts) {
  const { file, target } = opts;

  let args = [file];
  if (target) {
    args = ["--target", opts.target, ...args];
  }

  await butler(opts, "msi-install", args);
}

export interface IMsiUninstallOpts extends IButlerOpts {
  productCode: string;
}

async function msiUninstall(opts: IMsiUninstallOpts) {
  const { productCode } = opts;
  await butler(opts, "msi-uninstall", [productCode]);
}

async function caveCommand(opts: IButlerOpts): Promise<any> {
  return await butler(opts, "cave", []);
}

async function sanityCheck(ctx: MinimalContext): Promise<boolean> {
  try {
    await spawn.assert({
      ctx,
      command: "butler",
      args: ["--version"],
      logger: devNull,
    });
    return true;
  } catch (err) {
    return false;
  }
}

export default {
  cp,
  dl,
  apply,
  untar,
  unzip,
  wipe,
  mkdir,
  ditto,
  verify,
  file,
  walk,
  clean,
  msiInfo,
  msiInstall,
  msiUninstall,
  installPrereqs,
  sanityCheck,
  exeprops,
  elfprops,
  configure,
  configureSingle,
  caveCommand,
};
