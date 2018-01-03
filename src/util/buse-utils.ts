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

export function setupClient(client: Client, logger: Logger, ctx: Context) {
  client.onNotification(messages.Operation.Progress, ({ params }) => {
    ctx.emitProgress(params);
  });

  client.onNotification(messages.Log, ({ params }) => {
    switch (params.level) {
      case "debug":
        logger.debug(`[butler] ${params.message}`);
        break;
      case "info":
        logger.info(`[butler] ${params.message}`);
        break;
      case "warn":
        logger.warn(`[butler] ${params.message}`);
        break;
      case "error":
        logger.error(`[butler] ${params.message}`);
        break;
      default:
        logger.info(`[butler ${params.level}] ${params.message}`);
        break;
    }
  });

  client.onNotification(messages.TaskStarted, ({ params }) => {
    logger.info(
      `butler says task ${params.type} started (for ${params.reason})`
    );
    ctx.emitProgress({
      progress: 0,
      bps: 0,
      eta: 0,
    });
  });

  client.onNotification(messages.TaskEnded, ({ params }) => {
    logger.info(`butler says task ended`);
  });
}
