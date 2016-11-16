
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

import {each} from "underscore";

import delay from "../reactors/delay";

const GENEROSITY_PREWARM = 500;
const GENEROSITY_TIMEOUT = 1000;

import mklog from "../util/log";
const log = mklog("renderer-reactors/generosity");
import {opts} from "../logger";

export default function (watcher: Watcher) {
  watcher.on(actions.encourageGenerosity, async (store, action) => {
    const {level} = action.payload;

    if (level === "discreet") {
      await delay(GENEROSITY_PREWARM);

      const items = document.querySelectorAll(".generous");
      const className = "shake";
      each(items, (item) => {
        item.classList.add(className);
      });

      await delay(GENEROSITY_TIMEOUT);
      each(items, (item) => {
        item.classList.remove(className);
      });
    } else {
      log(opts, `Don't know how to encourage generosity @ level ${level}`);
    }
  });
}
