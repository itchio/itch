import { Client, RequestCreator, Conversation } from "butlerd";
import { Logger } from "common/logger";
import { MinimalContext } from "main/context";
import {
  asRequestError,
  getRpcErrorData,
  isInternalError,
  getErrorStack,
} from "common/butlerd/errors";
import * as messages from "common/butlerd/messages";
import { Cave, CaveSummary } from "common/butlerd/messages";
import { Store, isCancelled, isAborted } from "common/types";
import { delay } from "main/reactors/delay";

type WithCB<T> = (client: Client) => Promise<T>;

type ClientPromise = Promise<Client>;

var clientPromises = new WeakMap<Store, ClientPromise>();

async function makeClient(store: Store, parentLogger: Logger): Promise<Client> {
  const logger = parentLogger.childWithName("butlerd/make-client");

  while (true) {
    const { endpoint } = store.getState().butlerd;
    if (endpoint) {
      const client = new Client(endpoint);
      client.onWarning((msg) => {
        logger.warn(`(butlerd) ${msg}`);
      });
      return client;
    }

    logger.info(`Waiting for butlerd endpoint...`);
    await delay(1000);
  }
}

async function getClient(store: Store, parentLogger: Logger): Promise<Client> {
  let p: ClientPromise;
  if (clientPromises.has(store)) {
    p = clientPromises.get(store);
  } else {
    p = makeClient(store, parentLogger);
    clientPromises.set(store, p);
  }

  const client = await p;
  const currentEndpoint = store.getState().butlerd.endpoint;
  if (client.endpoint !== currentEndpoint) {
    parentLogger.warn(
      `(butlerd) Endpoint changed (${client.endpoint.tcp.address} => ${currentEndpoint.tcp.address}), making fresh client`
    );
    p = makeClient(store, parentLogger);
    clientPromises.set(store, p);
  }
  return p;
}

export type SetupFunc = (convo: Conversation) => void;

export async function call<Params, Res>(
  store: Store,
  logger: Logger,
  rc: RequestCreator<Params, Res>,
  params: Params,
  setup?: SetupFunc
): Promise<Res> {
  const client = await getClient(store, logger);

  try {
    logger.debug(`Calling ${rc({} as any)(client).method}`);
    return await client.call(rc, params, setup);
  } catch (e) {
    if (isCancelled(e)) {
      // nvm
    } else if (isAborted(e)) {
      // nvm
    } else {
      logger.error(`Caught butler error:`);
      if (isInternalError(e)) {
        const ed = getRpcErrorData(e);
        if (ed) {
          logger.error(`butler version: ${ed.butlerVersion}`);
          logger.error(`Golang stack:\n${ed.stack}`);
        }
        logger.error(`JavaScript stack: ${e.stack}`);
      } else {
        logger.error(`${e.message}`);
      }
    }
    throw e;
  }
}

export function hookProgress(convo: Conversation, ctx: MinimalContext) {
  convo.onNotification(messages.Progress, (params) => {
    ctx.emitProgress(params);
  });
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
