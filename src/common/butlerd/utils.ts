import { Conversation } from "@itchio/butlerd";
import { Logger } from "common/logger";
import { MinimalContext } from "main/context";
import * as messages from "common/butlerd/messages";
import { Cave, CaveSummary } from "common/butlerd/messages";

export function hookProgress(convo: Conversation, ctx: MinimalContext) {
  convo.onNotification(messages.Progress, (params) => {
    ctx.emitProgress(params);
  });
}

export function hookLogging(convo: Conversation, logger: Logger) {
  convo.onNotification(messages.Log, async ({ level, message }) => {
    switch (level) {
      case "debug":
        logger.debug(message);
        break;
      case "info":
        logger.info(message);
        break;
      case "warning":
        logger.warn(message);
        break;
      case "error":
        logger.error(message);
        break;
      default:
        logger.info(`[${level}] ${message}`);
        break;
    }
  });
}

export function getCaveSummary(cave: Cave): CaveSummary {
  return {
    id: cave.id,
    gameId: cave.game.id,
    lastTouchedAt: cave.stats.lastTouchedAt,
    secondsRun: cave.stats.secondsRun,
    localSecondsRun: cave.stats.localSecondsRun,
    localLastRunAt: cave.stats.localLastRunAt,
    installedSize: cave.installInfo.installedSize,
    interaction: cave.interaction,
  };
}
