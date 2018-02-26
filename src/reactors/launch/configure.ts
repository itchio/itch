import butler from "../../util/butler";

import * as paths from "../../os/paths";
import { devNull } from "../../logger";

import Context from "../../context";
import { formatVerdict } from "../../format/verdict";

import { IConfigureOpts } from "../../types";
import { Verdict } from "../../buse/messages";

export default async function configure(
  ctx: Context,
  opts: IConfigureOpts
): Promise<Verdict> {
  const { cave, runtime } = opts;
  const logger = opts.logger.child({ name: "configure" });

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
    logger: devNull,
  });
  logger.info(`Final verdict:\n${formatVerdict(verdict)}`);

  ctx.db.saveOne("caves", cave.id, {
    installedSize: verdict.totalSize,
    verdict: verdict,
  });

  return verdict;
}
