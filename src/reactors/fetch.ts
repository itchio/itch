
import {Watcher} from "./watcher";

import * as bluebird from "bluebird";
import * as invariant from "invariant";

import mklog from "../util/log";
const log = mklog("reactors/fetch");
import {opts} from "../logger";

import {getUserMarket, getGlobalMarket} from "./market";
import fetch from "../util/fetch";
import api from "../util/api";

import debounce from "./debounce";

import * as actions from "../actions";

import {ICredentials} from "../types";

const fetchUsuals = debounce(async function fetchUsuals (credentials: ICredentials) {
  invariant(credentials.key, "have API key");

  log(opts, "Fetching the usuals");

  const market = getUserMarket();
  const globalMarket = getGlobalMarket();

  try {
    await bluebird.all([
      fetch.dashboardGames(market, credentials),
      fetch.ownedKeys(market, globalMarket, credentials),
      fetch.collections(market, credentials),
    ]);
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, `Skipping fetch usuals, having network issues (${e.message})`);
    } else {
      throw e;
    }
  }
}, 300);

export default function (watcher: Watcher) {
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    const {focused} = action.payload;
    if (!focused) {
      // app just went in the background, nbd
      return;
    }

    const credentials = store.getState().session.credentials;
    if (!credentials.key) {
      log(opts, "Not logged in, not fetching anything yet");
      return;
    }

    await fetchUsuals(credentials);
  });

  watcher.on(actions.purchaseCompleted, async (store, action) => {
    const credentials = store.getState().session.credentials;
    if (!credentials.key) {
      log(opts, "Not logged in, not fetching anything yet");
      return;
    }

    await fetchUsuals(credentials);
  });

  watcher.on(actions.userDbReady, async (store, action) => {
    const credentials = store.getState().session.credentials;
    await fetchUsuals(credentials);
  });
}
