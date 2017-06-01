
import {Watcher} from "./watcher";

import * as bluebird from "bluebird";
import ibrew from "../util/ibrew";

import {map} from "underscore";

import {
  IStore,
  ILocalizedString,
} from "../types";

import * as actions from "../actions";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "setup"});

async function setup (store: IStore) {
  store.dispatch(actions.setupDone({}));
}

async function doSetup (store: IStore) {
  try {
    await setup(store);
  } catch (e) {
    logger.error("setup got error: ", e.stack);

    store.dispatch(actions.setupStatus({
      icon: "error",
      message: ["login.status.setup_failure", {error: (e.message || "" + e)}],
      stack: e.stack,
    }));
  }
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    await doSetup(store);
  });

  watcher.on(actions.retrySetup, async (store, action) => {
    await doSetup(store);
  });
}
