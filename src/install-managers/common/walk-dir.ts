import butler from "../../util/butler";

import { Logger } from "../../logger";
import Context from "../../context";

import { dirname } from "path";
import { reject } from "underscore";

interface IWalkDirOpts {
  logger: Logger;
  ctx: Context;
  destPath: string;
}

/**
 * Uses butler's walk command to find all files (and symlinks) in a directory,
 * recursively.
 */
export default async function walkDir(opts: IWalkDirOpts): Promise<string[]> {
  const { ctx, logger, destPath } = opts;

  const res = await butler.walk({
    ctx,
    logger,
    dir: destPath,
  });

  const files = reject(res.files, f => dirname(f) === ".itch");

  return files;
}
