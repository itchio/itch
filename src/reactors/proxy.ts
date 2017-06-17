
import {Watcher} from "./watcher";
import * as actions from "../actions";

import {IProxySettings} from "../types";
import partitionForUser from "../util/partition-for-user";

export default function (watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const userId = action.payload.me.id;

    const {session} = require("electron");
    const partition = partitionForUser(String(userId));
    const ourSession = session.fromPartition(partition, {cache: true});
    await applyProxySettings(ourSession, store.getState().system);
  });
}

interface IProxyConfig {
  /** The URL associated with the PAC file. */
  pacScript: string;
  /** Rules indicating which proxies to use. */
  proxyRules: string;
  /** Rules indicating which URLs should bypass the proxy settings. */
  proxyBypassRules: string;
}

/** Something that accepts electron proxy settings - usually a session */
interface IAcceptsProxyConfig {
  setProxy(config: IProxyConfig, callback: Function): void;
  enableNetworkEmulation(options: {
    offline?: boolean,
  }): void;
}

export async function applyProxySettings(session: IAcceptsProxyConfig, system: IProxySettings) {
  if (process.env.ITCH_EMULATE_OFFLINE === "1") {
    session.enableNetworkEmulation({
      offline: true,
    });
  }

  if (system.proxySource === "os") {
    // this means they've been detected from OS, no need to set them manually
    return;
  }

  const proxyRules = system.proxy;

  return await new Promise<void>((resolve, reject) => {
    session.setProxy({
      pacScript: null,
      proxyRules,
      proxyBypassRules: null,
    }, resolve);

    setTimeout(function () {
      reject(new Error("proxy settings adjustment timed out"));
    }, 1000);
  });
}
