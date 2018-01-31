import { Watcher } from "../watcher";
import { actions } from "../../actions";

import { getPendingForGame } from "./getters";
import { isEmpty } from "underscore";

import rootLogger from "../../logger";
import uuid from "../../util/uuid";
const logger = rootLogger.child({ name: "queue-download" });

export default function(watcher: Watcher) {
  watcher.on(actions.queueDownload, async (store, action) => {
    const downloadOpts = action.payload;
    const opts = downloadOpts;

    const downloadsState = store.getState().downloads;

    const pendingForGame = getPendingForGame(downloadsState, opts.game.id);
    if (!isEmpty(pendingForGame)) {
      // TODO: decide - do we show a notification instead?
      // what if the download is queued programmatically (from an update check, for example)
      logger.warn(`Not starting another download for ${opts.game.title}`);
      store.dispatch(actions.navigate({ url: "itch://downloads" }));
      return;
    }

    store.dispatch(
      actions.downloadStarted({
        ...opts,
        startedAt: new Date(),
        id: uuid(),
      })
    );
  });
}
