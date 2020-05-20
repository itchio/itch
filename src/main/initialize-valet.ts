import urls from "main/constants/urls";
import { butlerUserAgent } from "main/constants/useragent";
import { butlerDbPath } from "common/util/paths";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { Logger } from "common/logger";

import valet, { Client, Conversation, messages } from "@itchio/valet";

let logger = mainLogger.childWithName("butler");

export async function initializeValet() {
  valet.initialize({
    dbPath: butlerDbPath(),
    address: urls.itchio,
    userAgent: butlerUserAgent(),
  });
  {
    let { major, minor, patch } = valet.version;
    logger.info(`valet version: ${major}.${minor}.${patch}`);
  }

  const client = new Client();
  const res = await client.call(messages.VersionGet, {});
  logger.info(`butler version string: ${res.versionString}`);
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
