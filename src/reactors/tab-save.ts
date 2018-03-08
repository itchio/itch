import { map, size } from "underscore";

import { Watcher } from "./watcher";

import { DB } from "../db/index";
import { ITabDataSave } from "../types/index";
import { actions } from "../actions/index";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "tab-save" });

const eo: any = {};

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.tabsChanged, async (store, action) => {
    const { navigation, tabInstances, credentials } = store.getState().profile;
    if (!credentials || !credentials.me) {
      return;
    }
    const { tab, openTabs } = navigation;
    const meId = credentials.me.id;
    const items: ITabDataSave[] = map(openTabs.transient, id => {
      let data = tabInstances[id] || eo;
      if (size(data.games) > 1) {
        // make sure our snapshot isn't too large (don't cache
        // entire collections)
        data = {
          ...data,
          games: null,
        };
      }

      return {
        id,
        ...data,
      };
    });

    let _ = { meId, tab, items };
    _ = _;

    logger.error(`TODO: Re-implement tabsChanged with buse!`);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    logger.error(`TODO: Re-implement loginSucceeded tab restore with buse!`);

    // const { credentials } = store.getState().profile;
    // if (!credentials || !credentials.me) {
    //   return;
    // }
    // const meId = credentials.me.id;

    // const profile = db.profiles.findOneById(meId);
    // if (profile && profile.openTabs) {
    //   let { current, items } = profile.openTabs;

    //   // only restore valid items
    //   items = filter(items, item => isValidTabInstance(item));

    //   if (!isEmpty(items)) {
    //     // does our current tab still exist?
    //     if (findWhere(items, { id: current })) {
    //       // good!
    //     } else {
    //       // otherwise, fall back on a reasonable default
    //       current = "itch://featured";
    //     }

    //     store.dispatch(actions.tabsRestored({ current, items }));
    //   }
    // }
  });
}

// function isValidTabInstance(ti: ITabInstance): boolean {
//   const hasValidHistory = ti.history && Array.isArray(ti.history);
//   if (!hasValidHistory) {
//     return false;
//   }

//   const hasValidIndex =
//     ti.currentIndex >= 0 && ti.currentIndex < ti.history.length;
//   if (!hasValidIndex) {
//     return false;
//   }

//   return true;
// }
