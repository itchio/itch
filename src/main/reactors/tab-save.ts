import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Store, TabDataSave } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { filter, map } from "underscore";

const logger = mainLogger.child(__filename);

interface Snapshot {
  current: string;
  items: TabDataSave[];
}

const tabAutoSaveThreshold = 1 * 1000;

export default function (watcher: Watcher) {
  watcher.onDebounced(
    actions.tabsChanged,
    tabAutoSaveThreshold,
    async (store, action) => {
      await saveTabs(store);
    }
  );

  watcher.on(actions.requestLogout, async (store, action) => {
    await saveTabs(store);
  });
}

export async function saveTabs(store: Store) {
  const rs = store.getState();
  const { navigation, tabInstances } = rs.winds["root"];
  const { profile } = rs.profile;
  if (!profile) {
    return;
  }
  const { tab, openTabs } = navigation;
  const profileId = profile.id;
  let items: TabDataSave[];
  items = map(openTabs, (id) => {
    const ti = tabInstances[id];
    if (!ti) {
      return null;
    }

    const sp = Space.fromInstance(id, ti);
    const { history, currentIndex } = ti;
    const savedLabel = sp.label();
    return { id, history, currentIndex, savedLabel };
  });
  items = filter(items, (x) => !!x);

  const snapshot: Snapshot = { current: tab, items };

  await mcall(messages.ProfileDataPut, {
    profileId,
    key: "@itch/tabs",
    value: JSON.stringify(snapshot),
  });
}

export async function restoreTabs(store: Store, profile: Profile) {
  const profileId = profile.id;

  const { value, ok } = await mcall(messages.ProfileDataGet, {
    profileId,
    key: "@itch/tabs",
  });

  if (!ok) {
    logger.info(`No tabs to restore`);
    return;
  }

  try {
    const snapshot = JSON.parse(value) as Snapshot;
    if (!store.getState().preferences.enableTabs) {
      if (snapshot.items.length > 1) {
        snapshot.items = [snapshot.items[0]];
      }
    }

    const validTabs = new Set(snapshot.items.map((x) => x.id));
    if (validTabs.has(snapshot.current)) {
      store.dispatch(
        actions.tabsRestored({
          wind: "root",
          snapshot,
        })
      );
    } else {
      // nevermind
    }
  } catch (e) {
    logger.warn(`Could not retrieve saved tabs: ${e.message}`);
    return;
  }
}
