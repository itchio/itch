import { Client, Instance, Endpoint, Conversation } from "butlerd";
import { messages } from "common/butlerd";
import urls from "main/constants/urls";
import { butlerUserAgent } from "main/constants/useragent";
import { butlerDbPath } from "common/util/paths";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { Logger } from "common/logger";

let logger = mainLogger.childWithName("butler");

export interface ButlerState {
  instance: Instance;
  endpoint: Endpoint;
}

export async function startButler(ms: MainState) {
  const instance = new Instance({
    // TODO: use bundled butler in production, don't rely on %PATH% ever
    butlerExecutable: "butler",
    args: [
      "--dbpath",
      butlerDbPath(),
      "--address",
      urls.itchio,
      "--user-agent",
      butlerUserAgent(),
      "--destiny-pid",
      `${process.pid}`,
    ],
    log: msg => logger.info(msg),
  });
  let endpoint = await instance.getEndpoint();

  const client = new Client(endpoint);
  const res = await client.call(messages.VersionGet, {});
  logger.info(`Using butler ${res.versionString}`);

  ms.butler = {
    instance,
    endpoint,
  };
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
