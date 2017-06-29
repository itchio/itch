import handleWindowsPrereqs from "./windows-prereqs";

import Context from "../../context";
import { IPrepareOpts } from "../../types";

export default async function prepare(
  ctx: Context,
  opts: IPrepareOpts,
): Promise<void> {
  const { manifest, cave, game, runtime } = opts;
  const logger = opts.logger.child({ name: "prepare/native" });

  if (process.platform === "win32") {
    logger.info(`launching windows-prereqs`);
    try {
      await handleWindowsPrereqs(ctx, {
        manifest,
        cave,
        game,
        logger,
        runtime,
      });
    } catch (e) {
      logger.error(`Windows prereqs full stack: ${e.stack}`);
      throw e;
    }
  } else {
    logger.info(`not on windows, nothing to do`);
  }
}
