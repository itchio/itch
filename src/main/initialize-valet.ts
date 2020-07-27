import urls from "main/constants/urls";
import { butlerUserAgent } from "main/constants/useragent";
import { butlerDbPath } from "common/util/paths";
import { mainLogger } from "main/logger";
import { Logger, levelNumbers } from "common/logger";

import valet, { Client } from "@itchio/valet";
import { messages } from "common/butlerd";
import { Conversation } from "@itchio/valet/conversation";
import env from "common/env";
import { app } from "electron";
import { join } from "path";

let valetLogger = mainLogger.childWithName("valet");
let butlerLogger = mainLogger.childWithName("butler");

export async function initializeValet() {
  valet.initialize({
    dbPath: butlerDbPath(),
    address: urls.itchio,
    userAgent: butlerUserAgent(),
    appVersion: app.getVersion(),
    isCanary: env.isCanary,
    componentsDir: join(app.getPath("userData"), "broth"),
  } as any);
  {
    let { major, minor, patch } = valet.version;
    valetLogger.info(`valet version: ${major}.${minor}.${patch}`);
  }

  (async () => {
    while (true) {
      let record = await (valet as any).receiveLogRecord();
      let logger = valetLogger.childWithName(`valet/${record.target}`);
      let level = levelNumbers[record.level] ?? levelNumbers.trace;
      logger.log(level, record.message);
    }
  })().catch((e) => {
    console.error(`Logging infra broke: ${e.stack || e}`);
  });

  const client = new Client();
  const res = await client.call(messages.VersionGet, {});
  butlerLogger.info(`butler version: ${res.versionString}`);
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
