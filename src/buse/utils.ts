import { Cave, CaveSummary } from "../buse/messages";
import { Client, Instance, RequestError, IRequestCreator } from "node-buse";
import rootLogger, { Logger } from "../logger/index";
const lazyDefaultLogger = rootLogger.child({ name: "buse" });
import { MinimalContext } from "../context/index";
import * as ospath from "path";

import * as messages from "./messages";
import { butlerDbPath } from "../os/paths";
import { getBinPath } from "../util/ibrew/binpath";

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
    console.error(`Caught butler error: ${e.stack}`);
    const re = asRequestError(e);
    if (re && re.rpcError && re.rpcError.data) {
      console.error(`Golang stack:\n${re.rpcError.data.stack}`);
    }
    throw e;
  } finally {
    instance.cancel();
  }

  return res;
}

const eo = {};

export async function call<Params, Res>(
  rc: IRequestCreator<Params, Res>,
  params?: Params,
  clientSetup?: (client: Client) => void
): Promise<Res> {
  return await withButlerClient(lazyDefaultLogger, async client => {
    if (clientSetup) {
      clientSetup(client);
    }
    if (!params) {
      // that's a bit ugly but it lets us do call(messages.XXX)
      params = eo as Params;
    }
    return client.call(rc(params));
  });
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

export function getErrorMessage(e: any): string {
  if (!e) {
    return "Unknown error";
  }

  // TODO: this is a good place to do i18n on buse error codes!

  let errorMessage = e.message;
  const re = e.rpcError;
  if (re) {
    if (re.message) {
      // use just the json-rpc message if possible
      errorMessage = re.message;
    }
  }
  return errorMessage;
}

export function isInternalError(e: any): boolean {
  const re = asRequestError(e);

  if (!re) {
    return true;
  }

  if (re.rpcError.code < 0) {
    return true;
  }
  return false;
}

export function getErrorStack(e: any): string {
  if (!e) {
    return "Unknown error";
  }

  let errorStack = e.stack;

  const re = asRequestError(e);
  if (re) {
    if (re.rpcError.data && re.rpcError.data.stack) {
      // use golang stack if available
      errorStack = re.rpcError.data.stack;
    } else if (re.message) {
      // or just message
      errorStack = re.message;
    }
  }
  return errorStack;
}

export function asRequestError(e: any): RequestError {
  const re = e as RequestError;
  if (re.rpcError) {
    return e as RequestError;
  }
  return null;
}
