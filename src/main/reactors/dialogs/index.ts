import { Watcher } from "common/util/watcher";

import changeUser from "main/reactors/dialogs/change-user";
import requestCaveUninstall from "main/reactors/dialogs/request-cave-uninstall";
import manageGame from "main/reactors/dialogs/manage-game";
import manageCave from "main/reactors/dialogs/manage-cave";
import forceCloseGameRequest from "main/reactors/dialogs/force-close-game-request";
import showGameUpdate from "main/reactors/dialogs/show-game-update";
import clearBrowsingData from "main/reactors/dialogs/clear-browsing-data";
import scanInstallLocations from "main/reactors/dialogs/scan-install-locations";

export default function (watcher: Watcher) {
  changeUser(watcher);
  manageGame(watcher);
  manageCave(watcher);
  requestCaveUninstall(watcher);
  forceCloseGameRequest(watcher);
  showGameUpdate(watcher);
  clearBrowsingData(watcher);
  scanInstallLocations(watcher);
}
