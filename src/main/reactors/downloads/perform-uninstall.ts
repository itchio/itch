import { Logger } from "common/logger";

import { messages, withLogger } from "common/butlerd/index";

export async function performUninstall(parentLogger: Logger, caveId: string) {
  const logger = parentLogger.child({ name: "uninstall" });
  const call = withLogger(logger);

  await call(messages.UninstallPerform, { caveId }, client => {
    client.on(messages.TaskStarted, async ({ type, reason }) => {
      logger.info(`Task ${type} started (for ${reason})`);
    });

    client.on(messages.TaskSucceeded, async ({ type }) => {
      logger.info(`Task ${type} succeeded`);
    });
  });
  logger.info(`Uninstall successful`);
}
