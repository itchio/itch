import { map, filter } from "underscore";

import { Watcher } from "./watcher";

import { ITabDataSave, IStore } from "../types/index";
import { actions } from "../actions/index";

import { Space } from "../helpers/space";
import { Profile } from "../buse/messages";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "tab-save" });

import { messages, withLogger } from "../buse/index";
const call = withLogger(logger);

interface Snapshot {
  current: string;
  items: ITabDataSave[];
}

export default function(watcher: Watcher) {
  watcher.on(actions.tabsChanged, async (store, action) => {
    const { navigation, tabInstances, credentials } = store.getState().profile;
    if (!credentials || !credentials.me) {
      return;
    }
    const { tab, openTabs } = navigation;
    const profileId = credentials.me.id;
    let items: ITabDataSave[];
    items = map(openTabs.transient, id => {
      const ti = tabInstances[id];
      if (!ti) {
        return null;
      }

      const sp = Space.fromInstance(ti);
      const { history, currentIndex } = ti;
      const savedLabel = sp.label();
      return { id, history, currentIndex, savedLabel };
    });
    items = filter(items, x => !!x);

    const snapshot: Snapshot = { current: tab, items };

    await call(messages.ProfileDataPut, {
      profileId,
      key: "@itch/tabs",
      value: JSON.stringify(snapshot),
    });
  });
}

export async function restoreTabs(store: IStore, profile: Profile) {
  const profileId = profile.id;

  const { value, ok } = await call(messages.ProfileDataGet, {
    profileId,
    key: "@itch/tabs",
  });

  if (!ok) {
    logger.info(`No tabs to restore`);
    return;
  }

  try {
    const snapshot = JSON.parse(value) as Snapshot;
    store.dispatch(actions.tabsRestored(snapshot));
  } catch (e) {
    logger.warn(`Could not retrieve saved tabs: ${e.message}`);
    return;
  }
}
