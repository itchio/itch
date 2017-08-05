import butler from "../../util/butler";
import { extract } from "../../util/extract";
import deploy2, { IDeployOpts } from "../../util/deploy2";

import { elapsed } from "../../format/datetime";

import { coreOperate, ICoreInstallOpts, IInstallManager } from "./core";
import getInstallerType from "./get-installer-type";

async function install(opts: ICoreInstallOpts) {
  const { ctx, archivePath, destPath, caveId } = opts;
  const logger = opts.logger.child({ name: "archive/install" });

  logger.info(`deploying archive '${archivePath}' to '${destPath}'`);
  const startTime = Date.now();

  const deployOpts: IDeployOpts = {
    ctx,
    logger,
    destPath,
    partialReceipt: {
      cave: ctx.db.caves.findOneById(caveId),
    },
  };

  await deploy2(
    deployOpts,
    async () =>
      await extract({
        ctx,
        archivePath: opts.archivePath,
        destPath,
        logger,
      }),
  );

  const endTime = Date.now();
  logger.info(`deployed in ${elapsed(startTime, endTime)}`);

  // TODO: restore this
  // onSingle: async onlyFile => await handleNested(opts, onlyFile),
}

async function uninstall(opts: ICoreInstallOpts) {
  const { ctx, destPath } = opts;
  const logger = opts.logger.child({ name: "archive/install" });

  logger.info(`wiping directory ${destPath}`);
  await butler.wipe(destPath, { logger, ctx });
}

async function handleNested(opts: ICoreInstallOpts, onlyFile: string) {
  const { ctx, logger, runtime } = opts;

  // zipped installers need love too
  const installerName = await getInstallerType({
    ctx,
    logger,
    runtime,
    target: onlyFile,
  });

  if (installerName === "unknown") {
    return null;
  }

  logger.info(`found nested installer '${installerName}': ${onlyFile}`);
  await coreOperate(
    {
      ...opts,
      archivePath: onlyFile,
    },
    "install",
    installerName,
  );

  return { deployed: true };
}

const manager: IInstallManager = { install, uninstall };
export default manager;
