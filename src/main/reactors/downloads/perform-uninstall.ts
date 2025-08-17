import { hookLogging } from "common/butlerd/utils";
import * as messages from "common/butlerd/messages";
import { Logger } from "common/logger";
import { Store } from "common/types";
import { mcall } from "main/butlerd/mcall";
import { removeGameFromSteam } from "main/steam";

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

  // Remove game from Steam after successful uninstall
  try {
    const cave = await mcall(messages.FetchCave, { caveId });
    if (cave.cave && cave.cave.game) {
      await removeGameFromSteam(store, cave.cave.game);
      logger.info(`Removed ${cave.cave.game.title} from Steam`);
    }
  } catch (error) {
    logger.warn(`Failed to remove game from Steam: ${error}`);
  }
}
