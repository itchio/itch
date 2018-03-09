import { Watcher } from "../watcher";

import downloadSpeedWatcher from "./download-speed-watcher";
import showDownloadError from "./show-download-error";
import downloadEnded from "./download-ended";
import downloadPersist from "./download-persist";

export default function(watcher: Watcher) {
  downloadSpeedWatcher(watcher);
  showDownloadError(watcher);
  downloadEnded(watcher);
  downloadPersist(watcher);
}
