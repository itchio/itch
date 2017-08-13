import butler from "../../util/butler";
import { sortBy, filter } from "underscore";

import Context from "../../context";
import { Logger } from "../../logger";

const findUninstallers = async function(
  ctx: Context,
  logger: Logger,
  destPath: string,
  installerType: "inno" | "nsis",
): Promise<string[]> {
  const confRes = await butler.configure({
    ctx,
    logger,
    path: destPath,
    noFilter: true,
  });
  if (!confRes) {
    return [];
  }

  const { candidates } = confRes;
  const sortedCandidates = sortBy(candidates, "depth");

  const uninsCandidates = filter(sortedCandidates, c => {
    return c.windowsInfo && c.windowsInfo.installerType == installerType;
  });

  return uninsCandidates.map(c => c.path);
};

export default findUninstallers;
