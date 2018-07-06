import { Client, RequestCreator, RequestError, Endpoint } from "butlerd";
import { Logger, devNull } from "common/logger";
import { MinimalContext } from "main/context/index";
import * as messages from "./messages";
import { Cave, CaveSummary } from "./messages";
import { RootState, Store } from "common/types";
import { Conversation } from "butlerd/lib/client";
import { delay } from "main/reactors/delay";
import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

type WithCB<T> = (client: Client) => Promise<T>;

type ClientPromise = Promise<Client>;

var clientPromises = new WeakMap<Store, ClientPromise>();

async function makeClient(store: Store): Promise<Client> {
  while (true) {
    const { endpoint } = store.getState().butlerd;
    if (endpoint) {
      const client = new Client(endpoint);
      client.onWarning(msg => {
        console.warn(`(butlerd) ${msg}`);
      });
      return client;
    }

    console.log(`Waiting for butlerd endpoint...`);
    await delay(1000);
  }
}

async function getClient(store: Store): Promise<Client> {
  let p: ClientPromise;
  if (clientPromises.has(store)) {
    p = clientPromises.get(store);
  } else {
    p = makeClient(store);
    clientPromises.set(store, p);
  }

  const client = await p;
  if (client.endpoint !== store.getState().butlerd.endpoint) {
    console.warn(`(butlerd) Endpoint changed, making fresh client`);
    p = makeClient(store);
    clientPromises.set(store, p);
  }
  return p;
}

export type SetupFunc = (convo: Conversation) => void;

export async function call<Params, Res>(
  store: Store,
  rc: RequestCreator<Params, Res>,
  params: Params,
  setup?: SetupFunc
): Promise<Res> {
  const client = await getClient(store);

  try {
    return await client.call(rc, params, setup);
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
    throw e;
  }
}

export function hookProgress(convo: Conversation, ctx: MinimalContext) {
  convo.onNotification(messages.Progress, ({ params }) => {
    ctx.emitProgress(params);
  });
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
