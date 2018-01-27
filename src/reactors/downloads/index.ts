import { Watcher } from "../watcher";
import { DB } from "../../db";

import queueDownload from "./queue-download";
import downloadWatcher from "./download-watcher";
import downloadSpeedWatcher from "./download-speed-watcher";
import showDownloadError from "./show-download-error";
import downloadEnded from "./download-ended";
import downloadPersist from "./download-persist";

export default function(watcher: Watcher, db: DB) {
  queueDownload(watcher);
  downloadWatcher(watcher, db);
  downloadSpeedWatcher(watcher);
  showDownloadError(watcher, db);
  downloadEnded(watcher);
  downloadPersist(watcher, db);
}
