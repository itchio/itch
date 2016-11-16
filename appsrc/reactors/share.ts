
import {Watcher} from "./watcher";

import * as querystring from "querystring";

import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.initiateShare, async (store, action) => {
    const url: string = action.payload.url;
    const query = querystring.stringify({url});
    store.dispatch(actions.openUrl({url: `https://www.addtoany.com/share?${query}`}));
  });
}
