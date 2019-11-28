import { Client, Instance, Endpoint, Conversation } from "butlerd";
import { messages } from "common/butlerd";
import urls from "common/constants/urls";
import { butlerUserAgent } from "common/constants/useragent";
import { butlerDbPath } from "common/util/paths";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { Logger } from "common/logger";

let logger = mainLogger.childWithName("butler");

export interface ButlerState {
  instance: Instance;
  endpoint: Endpoint;
}

export async function startButler(mainState: MainState) {
  logger.info("Starting daemon...");
  const instance = new Instance({
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
  });
  let endpoint = await instance.getEndpoint();

  const client = new Client(endpoint);
  const res = await client.call(messages.VersionGet, {});
  logger.info(`Using butler ${res.versionString}`);

  mainState.butler = {
    instance,
    endpoint,
  };
}

export function hookLogging(convo: Conversation, logger: Logger) {
  convo.on(messages.Log, async ({ level, message }) => {
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
