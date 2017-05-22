
import rootLogger from "../logger";
const pino = rootLogger.child("market-provider");

import {IStore} from "../types";
import {IMarkets, IMarketGetter} from "../fetchers/types";

import * as actions from "../actions";
import {Watcher} from "../reactors/watcher";

import * as paths from "../os/paths";
import Market from "../db";

// FIXME: market is dead

let cache = window as any as {
  __itch_user_market: Market;
  __itch_global_market: Market;
};

let markets: IMarkets = {};
export const getMarkets: IMarketGetter = () => markets;

export default function marketProvider(watcher: Watcher) {
  watcher.onMount(async (store, action) => {
    await updateMarkets(store);
  });
  watcher.on(actions.loginSucceeded, async (store, action) => {
    await updateMarkets(store);
  });
  watcher.on(actions.logout, async (store, action) => {
    await updateMarkets(store);
  });
}

async function updateMarkets(store: IStore) {
  pino.info(`market provider updating markets...`);

  let market = await getUserMarket(store);
  let globalMarket = await getGlobalMarket(store);

  pino.info(`got markets: `, market, globalMarket);
  markets = {
    market,
    globalMarket,
  };
}

async function getUserMarket(store: IStore) {
  const state = store.getState();

  // we only want a user market if we're loaded
  if (!state ||
      !state.session ||
      !state.session.credentials ||
      !state.session.credentials.me) {
    pino.info(`user: not connected yet, will try again later`);
    cache.__itch_user_market = null;
    return null;
  }

  // maybe we reloaded, there might be a market stored in itch global
  let market = cache.__itch_user_market;
  if (market) {
    pino.info(`user: using cached market`);
    return market;
  }

  pino.info(`user: connecting...`);
  const meId = state.session.credentials.me.id;
  market = new Market();
  try {
    await market.load(paths.userDbPath(meId));
    pino.info(`user: connected!`);
  } catch (e) {
    console.error(`user: couldn't connect:\n${e.stack}`);
    market = null;
  }
  cache.__itch_user_market = market;
  return market;
}

async function getGlobalMarket(store: IStore) {
  let market = cache.__itch_global_market;

  if (market) {
    pino.info(`global: using cached market`);
    return market;
  }

  pino.info(`global: connecting...`);
  market = new Market();
  try {
    await market.load(paths.globalDbPath());
    pino.info(`global: connected!`);
  } catch (e) {
    console.error(`global: couldn't connect:\n${e.stack}`);
    market = null;
  }
  cache.__itch_global_market = market;
  return market;
}
