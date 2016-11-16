
import {Watcher} from "./watcher";
import * as actions from "../actions";

import delay from "./delay";

import * as moment from "moment-timezone";

import {IStore} from "../types";

import mklog from "../util/log";
const log = mklog("updater");
const opts = {
  logger: new mklog.Logger({
    sinks: {
      console: true,
    },
  }),
};

// 30 minutes, * 60 = seconds, * 1000 = milliseconds
const HALLOWEEN_CHECK_DELAY = 30 * 60 * 1000;

const HALLOWEEN_START = moment(new Date(new Date().getFullYear(), 9, 15));
const HALLOWEEN_END = moment(new Date(new Date().getFullYear(), 10, 3));

export function isHalloween () {
  let now = moment.tz(Date.now(), "UTC").tz(moment.tz.guess());
  return (HALLOWEEN_START <= now && now <= HALLOWEEN_END);
}

function halloweenCheck (store: IStore) {
  const bonuses = store.getState().status.bonuses;
  const spooky = isHalloween();

  if (spooky && !bonuses.halloween) {
    store.dispatch(actions.enableBonus({name: "halloween"}));
  }

  if (!spooky && bonuses.halloween) {
    store.dispatch(actions.disableBonus({name: "halloween"}));
  }
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    while (true) {
      try {
        halloweenCheck(store);
      } catch (e) {
        log(opts, `Got error: ${e.stack || e.message || e}`);
      }
      await delay(HALLOWEEN_CHECK_DELAY);
    }
  });
}
