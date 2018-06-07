import { map, filter } from "underscore";

import { Watcher } from "common/util/watcher";

import { ITabDataSave, IStore } from "common/types";
import { actions } from "common/actions";

import { Space } from "common/helpers/space";
import { Profile } from "common/butlerd/messages";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "tab-save" });

import { messages, withLogger } from "common/butlerd/index";
const call = withLogger(logger);

interface Snapshot {
  current: string;
  items: ITabDataSave[];
}

const tabAutoSaveThreshold = 10 * 1000;

export default function(watcher: Watcher) {
  watcher.onDebounced(
    actions.tabsChanged,
    tabAutoSaveThreshold,
    async (store, action) => {
      await saveTabs(store);
    }
  );
}

export async function saveTabs(store: IStore) {
  const rs = store.getState();
  const { navigation, tabInstances } = rs.windows["root"];
  const { credentials } = rs.profile;
  if (!credentials || !credentials.me) {
    return;
  }
  const { tab, openTabs } = navigation;
  const profileId = credentials.me.id;
  let items: ITabDataSave[];
  items = map(openTabs, id => {
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
