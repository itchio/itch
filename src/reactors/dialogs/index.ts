import { Watcher } from "../watcher";

import changeUser from "./change-user";
import requestCaveUninstall from "./request-cave-uninstall";
import abortGameRequest from "./abort-game-request";
import showGameUpdate from "./show-game-update";
import clearBrowsingData from "./clear-browsing-data";

export default function(watcher: Watcher) {
  changeUser(watcher);
  requestCaveUninstall(watcher);
  abortGameRequest(watcher);
  showGameUpdate(watcher);
  clearBrowsingData(watcher);
}
