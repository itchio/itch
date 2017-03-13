
import * as bluebird from "bluebird";

import fnout from "fnout";
import sf from "../../util/sf";
import { partial } from "underscore";

import mklog, {Logger} from "../../util/log";
const log = mklog("configure/common");

import {ICaveRecord, IGameRecord, IUploadRecord, IGlobalMarket} from "../../types";

import * as ospath from "path";

export interface IFixExecsResult {
  /** Number of executable files that were lacking the executable bit */
  numFixed: number;
  /** Executable files found, relative to the base path */
  executables: string[];
}

export interface IFixExecsOpts {
  logger: Logger;
}

export interface IConfigureOpts {
  logger: Logger;
  cave: ICaveRecord;
  game: IGameRecord;
  upload: IUploadRecord;
  globalMarket: IGlobalMarket;
}

export interface IConfigureResult {
  executables: string[];
}

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
export async function fixExecs(opts: IFixExecsOpts, field: string, basePath: string): Promise<IFixExecsResult> {
  const result: IFixExecsResult = {
    numFixed: 0,
    executables: [],
  };

  // TODO: this sounds like a nice candidate for a butler command instead.
  // My (amos) instinct is that doing it in node generates a lot of garbage and can make the UI lag.
  const mapper = partial(sniffAndChmod, opts, result, field, basePath);

  const globResults = sf.glob("**", { nodir: true, cwd: basePath });
  await bluebird.map(globResults, mapper, { concurrency: 2 });

  if (result.numFixed > 0) {
    log(opts, `${result.numFixed} executables/libraries were missing the executable bit`);
  }

  return result;
}

async function sniffAndChmod(opts: IFixExecsOpts, result: IFixExecsResult,
                             field: string, basePath: string, rel: string): Promise<void> {

  const file = ospath.join(basePath, rel);

  // cf. https://github.com/itchio/itch/issues/1154
  // if the file is a fifo, trying to read it will mess things up
  // this slows everything down, but it might be worth taking things
  // slow to prevent the apocalypse?
  const stats = await sf.lstat(file);
  if (!stats.isFile()) {
    return;
  }

  const type = await fnout.path(file);
  const isExec = type && (type as any)[field];
  if (!isExec) {
    return;
  }

  result.executables.push(rel);

  // tslint:disable-next-line:no-bitwise
  if (!!(stats.mode & 0o111)) {
    log(opts, `${rel}: is ${field}, already executable`);
    return;
  }

  try {
      log(opts, `${rel}: is ${field}, chmod +x`);
      await sf.chmod(file, 0o777);
      result.numFixed++;
  } catch (e) {
    log(opts, `Could not chmod ${file}: ${e.message}`);
    log(opts, `This might prevent the game from launching properly`);
  }
}

export default { fixExecs };
