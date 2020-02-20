import { Client, Instance, Endpoint, Conversation } from "butlerd";
import { messages } from "common/butlerd";
import which from "which";
import * as path from "path";
import urls from "main/constants/urls";
import { butlerUserAgent } from "main/constants/useragent";
import { butlerDbPath } from "common/util/paths";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { Logger } from "common/logger";
import { app } from "electron";
import { envSettings } from "main/constants/env-settings";

let logger = mainLogger.childWithName("butler");

export interface ButlerState {
  instance: Instance;
  endpoint: Endpoint;
}

function exeName(base: string): string {
  if (process.platform === "win32") {
    return `${base}.exe`;
  }
  return base;
}

export async function startButler(ms: MainState) {
  let butlerExecutable;
  if (envSettings.localButler) {
    logger.info(`===================================================`);
    logger.info(`Using local copy of butler - happy development!`);
    logger.info(`===================================================`);
    butlerExecutable = which.sync("butler");
  } else {
    const exePath = app.getPath("exe");
    logger.info(`exe path = ${exePath}`);
    const exeDir = path.dirname(exePath);
    logger.info(`exe dir = ${exeDir}`);
    butlerExecutable = path.join(exeDir, "deps", "butler", exeName("butler"));
    logger.info(`butler executable = ${butlerExecutable}`);
  }

  const instance = new Instance({
    butlerExecutable,
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
    log: msg => logger.debug(msg),
  });
  let endpoint = await instance.getEndpoint();

  const client = new Client(endpoint);
  const res = await client.call(messages.VersionGet, {});
  logger.info(`butler version: ${res.versionString}`);

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
