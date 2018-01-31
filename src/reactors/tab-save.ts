// import { map } from "underscore";

import { Watcher } from "./watcher";

// import { fromJSONField } from "../db/json-field";
import { DB } from "../db/index";
// import { ITabDataSave } from "../types/index";
// import { IProfile } from "../db/models/profile";
// import { actions } from "../actions/index";

// const eo: any = {};

export default function(watcher: Watcher, db: DB) {
  // TODO: re-implement
  /*
  watcher.on(actions.tabsChanged, async (store, action) => {
    const { navigation, tabData, credentials } = store.getState().session;
    if (!credentials || !credentials.me) {
      return;
    }
    const { tab, tabs } = navigation;
    const meId = credentials.me.id;
    const items: ITabDataSave[] = map(tabs.transient, id => {
      const data = tabData[id] || eo;
      return {
        id,
        ...data,
      };
    });

    db.saveOne<IProfile>("profiles", meId, {
      openTabs: { current: tab, items },
    });
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    const { credentials } = store.getState().session;
    if (!credentials || !credentials.me) {
      return;
    }
    const meId = credentials.me.id;

    const profile = db.profiles.findOneById(meId);
    if (profile && profile.openTabs) {
      const { current, items } = fromJSONField(profile.openTabs);
      store.dispatch(actions.tabsRestored({ current, items }));
    }
  });
  */
}
