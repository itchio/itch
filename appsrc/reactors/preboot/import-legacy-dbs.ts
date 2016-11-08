
import legacyDB from "../../util/legacy-db";
import sf from "../../util/sf";
import Market from "../../util/market";
import pathmaker from "../../util/pathmaker";

import {app} from "../../electron";

import {omit, indexBy, map} from "underscore";
import * as ospath from "path";

export async function importLegacyDBs (log: (opts: any, message: string) => void, opts: any) {
  const userDataPath = app.getPath("userData");

  // while importing, there's no need to dispatch DB_COMMIT events, they'll
  // be re-opened on login anyway
  const globalMarket = new Market();
  await globalMarket.load(pathmaker.globalDbPath());

  const usersDir = ospath.join(userDataPath, "users");
  const dbFiles = await sf.glob("*/db.jsonl", {cwd: usersDir});

  for (const dbFile of dbFiles) {
    const matches = /[0-9]+/.exec(dbFile);
    if (!matches) {
      log(opts, `Could not extract user id from ${dbFile}, skipping`);
      return;
    }

    const userId = matches[0];
    const oldDBFilename = ospath.join(usersDir, dbFile);
    const obsoleteMarker = oldDBFilename + ".obsolete";

    const markerExists = await sf.exists(obsoleteMarker);
    if (markerExists) {
      log(opts, `Skipping db import for ${userId}`);
    } else {
      log(opts, `Importing db for user ${userId}`);
      const response = await legacyDB.importOldData(oldDBFilename);
      const perUserResponse = {entities: omit(response.entities, "caves")};
      const globalResponse = {
        entities: {
          caves: indexBy(map(response.entities.caves, (cave, caveId) => {
            // in a global context, 'appdata' doesn't make sense anymore
            if (cave.installLocation === "appdata" || !cave.installLocation) {
              return Object.assign({}, cave, {installLocation: `appdata/${userId}`});
            } else {
              return cave;
            }
          }), "id"),
        },
      };

      const userMarket = new Market();
      const userDbPath = pathmaker.userDbPath(+userId);
      await userMarket.load(userDbPath);
      await userMarket.saveAllEntities(perUserResponse, {wait: true});

      await globalMarket.saveAllEntities(globalResponse, {wait: true});
      await sf.writeFile(obsoleteMarker, `If everything is working fine, you` +
        ` may delete both ${oldDBFilename} and this file!`);
      userMarket.close();
    }
  }

  // clean up dead caves
  const caves = globalMarket.getEntities("caves");
  const cavesToDelete: string[] = [];
  for (const caveId of Object.keys(caves)) {
    const cave = caves[caveId];
    if (!cave.gameId || cave.dead) {
      cavesToDelete.push(caveId);
    }
  }
  if (cavesToDelete.length > 0) {
    log(opts, `Pruning ${cavesToDelete.length} dead caves`);
    await globalMarket.deleteAllEntities({entities: {caves: cavesToDelete}}, {wait: true});
  }

  globalMarket.close();
}
