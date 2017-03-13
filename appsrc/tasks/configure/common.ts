
import fnout from "fnout";
import sf from "../../util/sf";
import { partial } from "underscore";

import mklog, {Logger} from "../../util/log";
const log = mklog("configure/common");

import {ICaveRecord, IGameRecord, IUploadRecord, IGlobalMarket} from "../../types";

import * as ospath from "path";

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
export async function fixExecs(opts: IFixExecsOpts, field: string, basePath: string): Promise<string[]> {
  // TODO: this sounds like a nice candidate for a butler command instead.
  // My (amos) instinct is that doing it in node generates a lot of garbage and can make the UI lag.
  const mapper = partial(sniffAndChmod, opts, field, basePath);

  return sf.glob("**", { nodir: true, cwd: basePath }).map(mapper, { concurrency: 2 }).filter((x: string) => !!x);
}

async function sniffAndChmod(opts: IFixExecsOpts, field: string, base: string, rel: string): Promise<string> {
  let file = ospath.join(base, rel);

  let type = await fnout.path(file);
  if (type && (type as any)[field]) {
    try {
      log(opts, `Fixing permissions for ${rel}: ${JSON.stringify(type, null, 2)}`);
      await sf.chmod(file, 0o777);
    } catch (e) {
      log(opts, `Could not chmod ${file}: ${e.message}`);
    }
    return rel;
  }
}

export default { fixExecs };
