import { Watcher } from "common/util/watcher";

import showDownloadError from "main/reactors/downloads/show-download-error";
import downloadEnded from "main/reactors/downloads/download-ended";
import driver from "main/reactors/downloads/driver";
import operations from "main/reactors/downloads/operations";

export default function (watcher: Watcher) {
  showDownloadError(watcher);
  downloadEnded(watcher);
  driver(watcher);
  operations(watcher);
}
