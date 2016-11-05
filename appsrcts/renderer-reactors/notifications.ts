
import * as ospath from "path";

import {IStore} from "../types/db";
import {IAction, INotifyHtml5Payload} from "../constants/action-types";

declare class Notification {
  onClick: () => void;

  constructor(title: string, opts: any)
}

async function notifyHtml5 (store: IStore, action: IAction<INotifyHtml5Payload>) {
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
}

export default {notifyHtml5};
