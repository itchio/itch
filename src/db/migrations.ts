import { IMigrations } from "./migrator";
import * as squel from "squel";

import { importOldDatabases } from "./import-old-database";
import { app } from "electron";
import { ICaveWithDeprecated, CaveModel } from "./models/cave";
import { Build } from "ts-itchio-api";

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

  1507191613: async m => {
    // fill in `build` for caves that only have `buildId`
    if (!m.hasColumns(CaveModel, ["buildId", "buildUserVersion"])) {
      // a fresh DB won't have these, it's ok to skip :)
      return;
    }

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
      db.saveOne("caves", caveToFix.id, {
        build: {
          id: caveToFix.buildId,
          userVersion: caveToFix.buildUserVersion,
        } as Build,
      });
    }

    m.dropColumns(CaveModel, ["buildId", "buildUserVersion"]);
  },
};
