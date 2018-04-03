import { Cave, CaveSummary } from "./messages";
import { RequestError, IRequestCreator, Client } from "butlerd";

import rootLogger, { Logger } from "../logger/index";
const lazyDefaultLogger = rootLogger.child({ name: "butlerd" });
import { MinimalContext } from "../context/index";

import * as messages from "./messages";
import { getRootState } from "../store/get-root-state";

type WithCB<T> = (client: Client) => Promise<T>;

export async function withButlerClient<T>(
  parentLogger: Logger,
  cb: WithCB<T>
): Promise<T> {
  const { endpoint } = getRootState().butlerd;
  if (!endpoint) {
    throw new Error(`no butlerd endpoint yet`);
  }
  const client = new Client(endpoint);
  await client.connect();
  setupLogging(client, parentLogger);

  let res: T;
  let err: Error;
  try {
    res = await cb(client);
  } catch (e) {
    console.error(`Caught butler error:`);
    if (isInternalError(e)) {
      const ed = getRpcErrorData(e);
      if (ed) {
        console.error(`butler version: ${ed.butlerVersion}`);
        console.error(`Golang stack:\n${ed.stack}`);
      }
      console.error(`JavaScript stack: ${e.stack}`);
    } else {
      console.error(`${e.message}`);
    }
    err = e;
  } finally {
    client.close();
  }

  if (err) {
    throw err;
  }
  return res;
}

type Call = <Params, Res>(
  rc: IRequestCreator<Params, Res>,
  params: Params,
  setup?: (client: Client) => void
) => Promise<Res>;

export let call: Call;

call = async function<Params, Res>(
  rc: IRequestCreator<Params, Res>,
  params: Params,
  setup?: (client: Client) => void
): Promise<Res> {
  return await callInternal(lazyDefaultLogger, rc, params, setup);
};

export const withLogger = (logger: Logger) => async <Params, Res>(
  rc: IRequestCreator<Params, Res>,
  params: Params,
  setup?: (client: Client) => void
): Promise<Res> => {
  return await callInternal(logger, rc, params, setup);
};

async function callInternal<Params, Res>(
  logger: Logger,
  rc: IRequestCreator<Params, Res>,
  params: Params,
  setup?: (client: Client) => void
): Promise<Res> {
  return await withButlerClient(logger, async client => {
    if (setup) {
      setup(client);
    }
    return await client.call(rc, params);
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

export function setupLogging(client: Client, logger: Logger) {
  client.onWarning(msg => {
    logger.warn(`(butlerd) ${msg}`);
  });

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

  // TODO: this is a good place to do i18n on butlerd error codes!

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
    const ed = getRpcErrorData(e);
    if (ed && ed.stack) {
      // use golang stack if available
      errorStack = ed.stack;
    } else if (re.message) {
      // or just message
      errorStack = re.message;
    }
  }
  return errorStack;
}

export function asRequestError(e: Error): RequestError {
  const re = e as RequestError;
  if (re.rpcError) {
    return e as RequestError;
  }
  return null;
}

export function getRpcErrorData(e: Error): RequestError["rpcError"]["data"] {
  const re = asRequestError(e);
  if (re && re.rpcError && re.rpcError.data) {
    return re.rpcError.data;
  }
  return null;
}
