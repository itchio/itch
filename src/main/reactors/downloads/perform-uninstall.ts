import { callFromStore, messages } from "common/butlerd/index";
import { Logger } from "common/logger";
import { Store } from "common/types";

export async function performUninstall(
  store: Store,
  parentLogger: Logger,
  caveId: string
) {
  const logger = parentLogger.child(__filename);
  const call = callFromStore(store, logger);

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
