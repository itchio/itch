import Context, { MinimalContext } from "../../context";
import { Logger } from "../../logger";

import { ICave } from "../../db/models/cave";

import * as paths from "../../os/paths";
import butler from "../../util/butler";
import uuid from "../../util/uuid";

import { Instance, messages } from "node-buse";

export interface IUninstallOpts {
  /** the cave to uninstall */
  cave: ICave;

  /** where to install the item */
  destPath: string;

  /** for cancellations, accessing db, etc. */
  ctx: Context;

  /** usually goes to a cave logger */
  logger: Logger;
}

import { setupClient } from "../../util/buse-utils";

export async function coreUninstall(opts: IUninstallOpts) {
  const logger = opts.logger.child({ name: "uninstall" });
  const { ctx, destPath, cave } = opts;

  const id = uuid();
  const preferences = ctx.store.getState().preferences;
  const stagingFolder = paths.downloadFolderPathForId(
    preferences,
    cave.installLocation,
    id
  );

  try {
    const instance = new Instance();
    instance.onClient(async client => {
      try {
        setupClient(client, logger, ctx);

        const res = await client.call(
          messages.Operation.Start({
            id,
            stagingFolder,
            operation: "uninstall",
            uninstallParams: {
              installFolder: destPath,
            },
          })
        );

        logger.info(`butler says operation ended`);
        logger.info(`final uninstall result:\n${JSON.stringify(res, null, 2)}`);
      } finally {
        instance.cancel();
      }
    });

    await instance.promise();
  } finally {
    try {
      await butler.wipe(stagingFolder, {
        ctx: new MinimalContext(),
        logger,
      });
    } catch (e) {
      logger.error(`Could not wipe stage folder: ${e.stack}`);
    }
  }
}
