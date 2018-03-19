import { Logger } from "../../logger";

import { messages, withButlerClient } from "../../buse/index";

export async function performUninstall(parentLogger: Logger, caveId: string) {
  const logger = parentLogger.child({ name: "uninstall" });

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
