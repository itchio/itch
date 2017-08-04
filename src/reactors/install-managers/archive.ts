import butler from "../../util/butler";
import { extract } from "../../util/extract";
import deploy from "../../util/deploy";

import { coreOperate, ICoreInstallOpts, IInstallManager } from "./core";
import getInstallerType from "./get-installer-type";

async function install(opts: ICoreInstallOpts) {
  const { ctx, archivePath } = opts;
  const logger = opts.logger.child({ name: "archive/install" });

  const stagePath = opts.archivePath + "-stage";
  await butler.wipe(stagePath, { logger, ctx });
  await butler.mkdir(stagePath, { logger, ctx });

  logger.info(`extracting archive '${archivePath}' to '${stagePath}'`);

  await ctx.withSub(async subCtx => {
    subCtx.on("progress", pi =>
      ctx.emitProgress({
        ...pi,
        progress: pi.progress * 0.8,
      }),
    );
    await extract({
      ctx: subCtx,
      archivePath: opts.archivePath,
      destPath: stagePath,
      logger,
    });
  });

  logger.info(`extracted all files ${archivePath} into staging area`);

  const { caveId } = opts;

  await ctx.withSub(async subCtx => {
    subCtx.on("progress", pi =>
      ctx.emitProgress({
        ...pi,
        progress: 0.8 + pi.progress * 0.2,
      }),
    );
    await deploy({
      ctx: subCtx,
      caveId,
      logger,
      stagePath,
      destPath: opts.destPath,
      onSingle: async onlyFile => await handleNested(opts, onlyFile),
    });
  });

  logger.info("wiping stage...");
  await butler.wipe(stagePath, { logger, ctx });
  logger.info("done wiping stage");
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
