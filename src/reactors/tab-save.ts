import { map, size } from "underscore";

import { Watcher } from "./watcher";

import { ITabDataSave } from "../types/index";
import { actions } from "../actions/index";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "tab-save" });

const eo: any = {};

export default function(watcher: Watcher) {
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
  });
}
