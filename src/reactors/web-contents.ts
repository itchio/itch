import * as actions from "../actions";
import { Watcher } from "./watcher";

import { webContents } from "electron";

import staticTabData from "../constants/static-tab-data";

export default function(watcher: Watcher) {
  watcher.on(actions.tabGotWebContents, async (store, action) => {
    const { tab, webContentsId } = action.payload;

    const frozen = staticTabData[tab];
    if (!frozen) {
      return;
    }

    const wc = webContents.fromId(webContentsId);
    wc.on("will-navigate", (ev, url) => {
      ev.preventDefault();
      store.dispatch(actions.navigate({ tab: `url/${url}` }));
    });
  });
}
