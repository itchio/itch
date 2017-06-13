
import {Watcher} from "../watcher";

import startDownload from "./start-download";
import downloadEnded from "./download-ended";
import downloadWatcher from "./download-watcher";
import downloadSpeedWatcher from "./download-speed-watcher";

export default function (watcher: Watcher) {
  startDownload(watcher);
  downloadEnded(watcher);
  downloadWatcher(watcher);
  downloadSpeedWatcher(watcher);
}
