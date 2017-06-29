import butler from "../../util/butler";

import * as paths from "../../os/paths";

import Context from "../../context";

import { IConfigureOpts } from "../../types";

export default async function configure(ctx: Context, opts: IConfigureOpts) {
  const { cave, logger, runtime } = opts;

  const appPath = paths.appPath(cave, ctx.store.getState().preferences);
  logger.info(`configuring ${appPath}`);

  let osFilter;
  let archFilter;

  switch (runtime.platform) {
    case "linux":
      osFilter = "linux";
      if (runtime.is64) {
        archFilter = "amd64";
      } else {
        archFilter = "386";
      }
      break;
    case "osx":
      osFilter = "darwin";
      archFilter = "amd64";
      break;
    case "windows":
      osFilter = "windows";
      if (runtime.is64) {
        archFilter = "amd64";
      } else {
        archFilter = "386";
      }
      break;
    default:
      logger.warn(`unrecognized platform, assuming linux-amd64`);
      osFilter = "linux";
      archFilter = "amd64";
  }

  const verdict = await butler.configure({
    ctx,
    path: appPath,
    osFilter,
    archFilter,
    logger,
  });
  logger.info(`verdict =\n${JSON.stringify(verdict, null, 2)}`);

  ctx.db.saveOne("caves", cave.id, {
    installedSize: verdict.totalSize,
    verdict: verdict,
  });
}
