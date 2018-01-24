import { Watcher } from "../watcher";
import { DB } from "../../db";

import changeUser from "./change-user";
import requestCaveUninstall from "./request-cave-uninstall";
import manageGame from "./manage-game";
import forceCloseGameRequest from "./force-close-game-request";
import showGameUpdate from "./show-game-update";
import clearBrowsingData from "./clear-browsing-data";
import discardDownloadRequest from "./discard-download-request";

export default function(watcher: Watcher, db: DB) {
  changeUser(watcher);
  manageGame(watcher, db);
  requestCaveUninstall(watcher, db);
  forceCloseGameRequest(watcher);
  showGameUpdate(watcher);
  clearBrowsingData(watcher);
  discardDownloadRequest(watcher);
}
