
import {Watcher} from "./watcher";

import * as bluebird from "bluebird";
import ibrew from "../util/ibrew";

import {map} from "underscore";

import {
  IStore,
  ILocalizedString,
} from "../types";

import * as actions from "../actions";

import mklog from "../util/log";
const log = mklog("reactors/setup");
import logger, {opts} from "../logger";

async function fetch (store: IStore, name: string) {
  const opts = {
    logger,
    onStatus: (icon: string, message: ILocalizedString) => {
      store.dispatch(actions.setupStatus({icon, message}));
    },
  };

  await ibrew.fetch(opts, name);
}

async function setup (store: IStore) {
  log(opts, "setup starting");
  await fetch(store, "unarchiver");
  log(opts, "unarchiver done");
  await bluebird.all(map([
    "butler",
    "elevate",
    "isolate",
    "activate",
    "firejail",
    "dllassert",
  ], async (name) => await fetch(store, name)));
  log(opts, "all deps done");
  store.dispatch(actions.setupDone({}));
}

async function doSetup (store: IStore) {
  try {
    await setup(store);
  } catch (e) {
    const err = e.ibrew || e;
    log(opts, "setup got error: ", err);
    store.dispatch(actions.setupStatus({
      icon: "error",
      message: ["login.status.setup_failure", {error: (err.message || "" + err)}],
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
