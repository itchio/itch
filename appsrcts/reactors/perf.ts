
import mklog from "../util/log";
const log = mklog("reactors/perf");
import {opts} from "../logger";

import * as actions from "../actions";

import {
  IStore,
} from "../types";

import {
  IAction,
  IPrebootPayload,
  IBootPayload,
  ILoginSucceededPayload,
  IFirstUsefulPagePayload,
} from "../constants/action-types";

let prebootTime: number;
let bootTime: number;
let loginTime: number;
let pageTime: number;
let done = false;

async function preboot (store: IStore, action: IAction<IPrebootPayload>) {
  prebootTime = Date.now();
}

async function boot (store: IStore, action: IAction<IBootPayload>) {
  bootTime = Date.now();
}

async function loginSucceeded (store: IStore, action: IAction<ILoginSucceededPayload>) {
  loginTime = Date.now();
}

async function firstUsefulPage (store: IStore, action: IAction<IFirstUsefulPagePayload>) {
  if (done) {
    return;
  }
  done = true;

  pageTime = Date.now();
  log(opts, `preboot -> boot        = ${(bootTime - prebootTime)} ms`);
  log(opts, `boot    -> login       = ${(loginTime - bootTime)} ms`);
  log(opts, `login   -> first page  = ${(pageTime - loginTime)} ms`);
  
  if (process.env.PROFILE_REQUIRE === "1") {
    store.dispatch(actions.quit());
  }
}

export default {preboot, boot, loginSucceeded, firstUsefulPage};
