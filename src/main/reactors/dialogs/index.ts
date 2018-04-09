import { Watcher } from "common/util/watcher";

import changeUser from "./change-user";
import requestCaveUninstall from "./request-cave-uninstall";
import manageGame from "./manage-game";
import forceCloseGameRequest from "./force-close-game-request";
import showGameUpdate from "./show-game-update";
import clearBrowsingData from "./clear-browsing-data";
import scanInstallLocations from "./scan-install-locations";

export default function(watcher: Watcher) {
  changeUser(watcher);
  manageGame(watcher);
  requestCaveUninstall(watcher);
  forceCloseGameRequest(watcher);
  showGameUpdate(watcher);
  clearBrowsingData(watcher);
  scanInstallLocations(watcher);
}
