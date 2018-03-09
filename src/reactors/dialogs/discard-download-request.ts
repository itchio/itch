import { Watcher } from "../watcher";
import { actions } from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.discardDownloadRequest, async (store, action) => {
    throw new Error(`TODO: re-implement me with buse`);
  });
}
