import butler from "../../util/butler";

import { Logger } from "../../logger";
import Context from "../../context";

interface IWalkDirOpts {
  logger: Logger;
  ctx: Context;
  destPath: string;
}

export default async function walkDir(opts: IWalkDirOpts): Promise<string[]> {
  const { ctx, logger, destPath } = opts;

  const res = await butler.walk({
    ctx,
    logger,
    dir: destPath,
  });
  return res.files;
}
