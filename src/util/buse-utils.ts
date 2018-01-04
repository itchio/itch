import { IGameCredentials } from "../types/index";
import { GameCredentials } from "node-buse/lib/messages";
import urls from "../constants/urls";
import { Client, messages } from "node-buse";
import { Logger } from "../logger/index";
import Context from "../context/index";

export function buseGameCredentials(
  credentials: IGameCredentials
): GameCredentials {
  return {
    apiKey: credentials.apiKey,
    downloadKey: credentials.downloadKey ? credentials.downloadKey.id : null,
    server: urls.itchioApi,
  };
}

export function setupClient(
  client: Client,
  parentLogger: Logger,
  ctx: Context
) {
  client.onNotification(messages.Operation.Progress, ({ params }) => {
    ctx.emitProgress(params);
  });

  const logger = parentLogger.child({ name: "butler" });

  client.onNotification(messages.Log, ({ params }) => {
    switch (params.level) {
      case "debug":
        logger.debug(params.message);
        break;
      case "info":
        logger.info(params.message);
        break;
      case "warning":
        logger.warn(params.message);
        break;
      case "error":
        logger.error(params.message);
        break;
      default:
        logger.info(`[${params.level}] ${params.message}`);
        break;
    }
  });

  client.onNotification(messages.TaskStarted, ({ params }) => {
    parentLogger.info(
      `butler task started: ${params.type} (for ${params.reason})`
    );
  });

  client.onNotification(messages.TaskEnded, ({ params }) => {
    parentLogger.info(`butler task ended`);
  });
}
