import { IMigrations } from "./migrator";
import * as squel from "squel";

import { importOldDatabases } from "./import-old-database";
import { app } from "electron";
import { IBuild } from "../types/index";
import { ICaveWithDeprecated, CaveModel } from "./models/cave";

// stolen from lapis, yay
export default <IMigrations>{
  1498742676: async m => {
    // the DB schema is automatically synchronized, migrations
    // aren't useful for that
  },

  1500300276: async m => {
    const { logger, db } = m;
    const userDataPath = app.getPath("userData");
    importOldDatabases({
      logger,
      db,
      userDataPath,
    });
  },

  1506341540: async m => {
    // fill in `build` for caves that only have `buildId`
    const { db } = m;
    const cavesToFix = db.caves.all(k =>
      k.where(
        squel
          .expr()
          .and("build IS NULL")
          .and("buildId IS NOT NULL")
      )
    ) as ICaveWithDeprecated[];

    for (const caveToFix of cavesToFix) {
      // TODO: we could do API calls here to get the full build info
      // but that seems like the wrong thing to do in a migration,
      // maybe we could have a check/fix in loginSucceeded ?
      db.saveOne("caves", caveToFix.id, {
        build: {
          id: caveToFix.buildId,
          userVersion: caveToFix.buildUserVersion,
          migrated: true,
        } as Partial<IBuild>,
      });
    }
  },

  1506688480: async m => {
    m.dropColumns(CaveModel, ["buildId", "buildUserVersion"]);
  },
};
