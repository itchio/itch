import { messages, hookLogging } from "common/butlerd";
import { Logger } from "common/logger";
import { Store } from "common/types";
import { mcall } from "main/butlerd/mcall";

export async function performUninstall(
  store: Store,
  parentLogger: Logger,
  caveId: string
) {
  const logger = parentLogger.child(__filename);

  await mcall(messages.UninstallPerform, { caveId }, (convo) => {
    hookLogging(convo, logger);

    convo.onNotification(messages.TaskStarted, async ({ type, reason }) => {
      logger.info(`Task ${type} started (for ${reason})`);
    });

    convo.onNotification(messages.TaskSucceeded, async ({ type }) => {
      logger.info(`Task ${type} succeeded`);
    });
  });
  logger.info(`Uninstall successful`);
}
