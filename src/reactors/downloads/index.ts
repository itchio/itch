import { Watcher } from "../watcher";

import queueDownload from "./queue-download";
import downloadEnded from "./download-ended";
import downloadWatcher from "./download-watcher";
import downloadSpeedWatcher from "./download-speed-watcher";

export default function(watcher: Watcher) {
  queueDownload(watcher);
  downloadEnded(watcher);
  downloadWatcher(watcher);
  downloadSpeedWatcher(watcher);
}
