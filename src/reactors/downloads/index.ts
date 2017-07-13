import { Watcher } from "../watcher";
import { DB } from "../../db";

import queueDownload from "./queue-download";
import downloadEnded from "./download-ended";
import downloadWatcher from "./download-watcher";
import downloadSpeedWatcher from "./download-speed-watcher";

export default function(watcher: Watcher, db: DB) {
  queueDownload(watcher);
  downloadEnded(watcher);
  downloadWatcher(watcher, db);
  downloadSpeedWatcher(watcher);
}
