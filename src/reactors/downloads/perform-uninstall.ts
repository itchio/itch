import { Logger } from "../../logger";

import { messages, withButlerClient } from "../../buse/index";

export interface IUninstallOpts {
  /** ID of the cave to uninstall */
  caveId: string;

  /** usually goes to a cave logger */
  logger: Logger;
}

export async function performUninstall(opts: IUninstallOpts) {
  const logger = opts.logger.child({ name: "uninstall" });
  const { caveId } = opts;

  await withButlerClient(logger, async client => {
    client.onNotification(messages.TaskStarted, ({ params }) => {
      const { type, reason } = params;
      logger.info(`Task ${type} started (for ${reason})`);
    });

    client.onNotification(messages.TaskSucceeded, ({ params }) => {
      const { type } = params;
      logger.info(`Task ${type} succeeded`);
    });

    await client.call(messages.UninstallPerform({ caveId }));

    logger.info(`Uninstall successful`);
  });
}
