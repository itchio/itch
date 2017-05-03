
import {IGlobalMarket, IUserMarket} from "../types/index";
import store from "../store/chrome-store";

import Market from "../util/market";
import pathmaker from "../util/pathmaker";

let windowAny = window as any;

let globalMarket: IGlobalMarket;
let globalMarketPromise: Promise<void>;
let userMarket: IUserMarket;
let userMarketPromise: Promise<void>;

async function loadGlobalMarket() {
  let m = windowAny.__itch_global_market;
  if (!m) {
    m = new Market();
    await m.load(pathmaker.globalDbPath());
    windowAny.__itch_global_market = m;
  }
  globalMarket = m;
}

async function loadUserMarket(userId: number) {
  let m = windowAny.__itch_user_market;
  if (!m) {
    m = new Market();
    await m.load(pathmaker.userDbPath(userId));
    windowAny.__itch_user_market = m;
  }
  userMarket = m;
}

export async function getGlobalMarket(): Promise<IGlobalMarket> {
  if (!globalMarketPromise) {
    globalMarketPromise = loadGlobalMarket();
  }

  await globalMarketPromise;
  return globalMarket;
}

export async function getUserMarket(): Promise<IUserMarket> {
  // no me yet, null market
  const state = store.getState();
  if (!state ||
      !state.session || 
      !state.session.credentials ||
      !state.session.credentials.me) {
    return null;
  }

  if (!userMarketPromise) {
    userMarketPromise = loadUserMarket(state.session.credentials.me.id);
  }

  await userMarketPromise;
  return userMarket;
}

