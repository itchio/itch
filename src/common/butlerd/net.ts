import { Client, Endpoint, RequestCreator, Conversation } from "butlerd";
import { isEqual } from "underscore";
import { Store, isCancelled, isAborted } from "common/types";
import {
  asRequestError,
  getRpcErrorData,
  isInternalError,
  getErrorStack,
} from "common/butlerd/errors";
import { Logger } from "common/logger";
import { delay } from "main/reactors/delay";

export type SetupFunc = (convo: Conversation) => void;

var clients: Record<string, Client> = {};

async function getEndpoint(
  store: Store,
  parentLogger: Logger
): Promise<Endpoint> {
  const logger = parentLogger.childWithName("butlerd/get-endpoint");
  while (true) {
    const { endpoint } = store.getState().butlerd;
    if (endpoint) {
      return endpoint;
    }

    logger.info(`Waiting for butlerd endpoint...`);
    await delay(1000);
  }
}

function makeClient(endpoint: Endpoint, parentLogger: Logger): Client {
  const logger = parentLogger.childWithName("butlerd/make-client");

  const client = new Client(endpoint);
  client.onWarning((msg) => {
    logger.warn(`(butlerd) ${msg}`);
  });
  return client;
}

function makeEndpointKey(endpoint: Endpoint): string {
  return `${endpoint.tcp.address}:${endpoint.secret}`;
}

async function getClient(store: Store, parentLogger: Logger): Promise<Client> {
  let c: Client;
  let endpoint = store.getState().butlerd.endpoint;
  if (!endpoint) {
    endpoint = await getEndpoint(store, parentLogger);
  }
  const endpointKey = makeEndpointKey(endpoint);
  const foundClient = clients[endpointKey];
  if (foundClient) {
    c = foundClient;
  } else {
    c = makeClient(endpoint, parentLogger);
    clients[endpointKey] = c;
  }

  const currentEndpoint = store.getState().butlerd.endpoint;
  if (!isEqual(c.endpoint, currentEndpoint)) {
    parentLogger.warn(
      `(butlerd) Endpoint changed (${c.endpoint.tcp.address} => ${currentEndpoint.tcp.address}), making fresh client`
    );
    c = makeClient(endpoint, parentLogger);
    clients[endpointKey] = c;
  }
  return c;
}

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
