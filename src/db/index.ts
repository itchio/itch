import { DB } from "./db";
import {
  runMigrations,
  checkSchema,
  hasSchemaErrors,
  fixSchema,
  markAllMigrated,
} from "./migrator";
import { modelMap } from "./repository";
import migrations from "./migrations";
export * from "./db";

import { elapsed } from "../format";
import { IStore } from "../types";
import { globalDbPath } from "../os/paths";
import rootLogger from "../logger";
const logger = rootLogger.child({ name: "db" });

let db = new DB();

export async function connectDatabase(store: IStore) {
  const t1 = Date.now();
  const dbPath = globalDbPath();
  logger.info(`connecting to db ${dbPath}`);

  logger.info(`db connection established in ${elapsed(t1, Date.now())}`);
  await db.load(store, dbPath);

  const q = db.getQuerier();

  let migrationsFailed = false;
  try {
    runMigrations(q, migrations);
  } catch (e) {
    migrationsFailed = true;
    logger.info(`db migrations failed: ${e.stack}`);
    logger.info(`(we'll fix that right now)`);
  }

  const checkResult = checkSchema(q, modelMap);
  const { toCreate, toSync } = checkResult;

  if (hasSchemaErrors(checkResult)) {
    if (toCreate.length) {
      logger.info(
        `creating missing tables: ${JSON.stringify(
          toCreate.map(m => m.model.table),
        )}`,
      );
    }
    if (toSync.length) {
      logger.info(
        `syncing mistyped tables: ${JSON.stringify(
          toSync.map(m => m.model.table),
        )}`,
      );
    }
  } else {
    logger.info(`db looks good!`);
  }

  fixSchema(q, checkResult);

  if (migrationsFailed) {
    logger.info(`marking all migrations successful, since they failed earlier`);
    markAllMigrated(q, migrations);
  }
}

export default db;
