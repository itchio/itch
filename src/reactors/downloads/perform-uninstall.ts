import Context, { MinimalContext } from "../../context";
import { Logger } from "../../logger";

import { ICave } from "../../db/models/cave";

import * as paths from "../../os/paths";
import butler from "../../util/butler";
import uuid from "../../util/uuid";

import { messages, setupClient, makeButlerInstance } from "../../buse/index";

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

// TODO: should this be wrapped in asTask, with a show-error modal?
export async function performUninstall(opts: IUninstallOpts) {
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
    const instance = await makeButlerInstance();
    instance.onClient(async client => {
      try {
        setupClient(client, logger, ctx);

        client.onNotification(messages.TaskStarted, ({ params }) => {
          const { type, reason } = params;
          logger.info(`Task ${type} started (for ${reason})`);
        });

        client.onNotification(messages.TaskSucceeded, ({ params }) => {
          const { type } = params;
          logger.info(`Task ${type} succeeded`);
        });

        await client.call(
          messages.OperationStart({
            id,
            stagingFolder,
            operation: messages.Operation.Uninstall,
            uninstallParams: {
              installFolder: destPath,
            },
          })
        );

        logger.info(`Uninstall successful`);
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
