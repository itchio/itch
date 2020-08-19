import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import { ProxySettings } from "common/types";
import { partitionForUser } from "common/util/partition-for-user";
import { session, Session } from "electron";

export default function (watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const userId = action.payload.profile.user.id;

    const partition = partitionForUser(String(userId));
    const ourSession = session.fromPartition(partition, { cache: true });
    await applyProxySettings(ourSession, store.getState().system);
  });
}

export async function applyProxySettings(
  session: Session,
  system: ProxySettings
) {
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

  await session.setProxy({
    pacScript: null,
    proxyRules,
    proxyBypassRules: null,
  });
}
