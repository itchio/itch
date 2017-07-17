import { IMigrations } from "./migrator";

import { importOldDatabases } from "./import-old-database";
import { app } from "electron";

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
};
