
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

import * as ospath from "path";

declare class Notification {
  onClick: () => void;

  constructor(title: string, opts: any)
}

export default function (watcher: Watcher) {
  watcher.on(actions.notifyHtml5, async (store, action) => {
    const {title, onClick} = action.payload;
    const opts = Object.assign({}, action.payload.opts);

    if (opts.icon) {
      opts.icon = ospath.resolve(ospath.join(__dirname, "..", opts.icon));
    }
    const notification = new Notification(title, opts); // eslint-disable-line

    if (onClick) {
      notification.onClick = () => {
        store.dispatch(onClick);
      };
    }
  })
}
