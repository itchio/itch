import { Cave, CaveSummary } from "../buse/messages";
import { Client, Instance } from "node-buse";
import { Logger } from "../logger/index";
import { MinimalContext } from "../context/index";
import * as ospath from "path";
import { getBinPath } from "../util/ibrew";

import * as messages from "./messages";
import { butlerDbPath } from "../os/paths";

// TODO: pass server URL to butler

export async function makeButlerInstance(): Promise<Instance> {
  // TODO: respect global lock when we're updating butler
  return new Instance({
    butlerExecutable: ospath.join(getBinPath(), "butler"),
    args: ["--dbpath", butlerDbPath()],
  });
}

export type WithCB<T> = (client: Client) => Promise<T>;

export async function withButlerClient<T>(
  parentLogger: Logger,
  cb: WithCB<T>
): Promise<T> {
  let res: T;
  const instance = await makeButlerInstance();

  try {
    instance.onClient(async client => {
      setupLogging(client, parentLogger);
      res = await cb(client);
      instance.cancel();
    });
    await instance.promise();
  } catch (e) {
    console.log(`Caught butler error: ${e.stack}`);
    if ((e as any).rpcError) {
      const { rpcError } = e as any;
      console.log(`Golang stack:\n${rpcError.data.stack}`);
    }
    throw e;
  } finally {
    instance.cancel();
  }

  return res;
}

export function setupClient(
  client: Client,
  parentLogger: Logger,
  ctx: MinimalContext
) {
  client.onNotification(messages.Progress, ({ params }) => {
    ctx.emitProgress(params);
  });

  setupLogging(client, parentLogger);
}

export function setupLogging(client: Client, parentLogger: Logger) {
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
}

export function getCaveSummary(cave: Cave): CaveSummary {
  return {
    id: cave.id,
    gameId: cave.game.id,
    lastTouchedAt: cave.stats.lastTouchedAt,
    secondsRun: cave.stats.secondsRun,
    installedSize: cave.installInfo.installedSize,
  };
}
