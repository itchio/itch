import { DB } from "./db";
import {
  runMigrations,
  checkSchema,
  hasSchemaErrors,
  fixSchema,
  IMigrations,
} from "./migrator";
import { modelMap } from "./repository";
import defaultMigrations from "./migrations";
export * from "./db";

import { IStore } from "../types";
import { globalDbPath } from "../os/paths";
import rootLogger from "../logger";
const logger = rootLogger.child({ name: "db" });

// singleton database for the actual app
let db: DB;

export async function connectDatabase(store: IStore) {
  db = new DB(modelMap);

  const dbPath = globalDbPath();
  logger.info(`connecting to db ${dbPath}`);
  db.load(store, dbPath);
  await migrateDatabase(db, defaultMigrations);
}

// this variant is exported for testing
export async function migrateDatabase(database: DB, migrations: IMigrations) {
  const q = database.getQuerier();

  const checkResult = checkSchema(q, database.modelMap);
  const { toCreate, toSync } = checkResult;

  if (hasSchemaErrors(checkResult)) {
    if (toCreate.length) {
      logger.info(
        `creating missing tables: ${JSON.stringify(
          toCreate.map(m => m.model.table)
        )}`
      );
    }
    if (toSync.length) {
      logger.info(
        `syncing mistyped tables: ${JSON.stringify(
          toSync.map(m => m.model.table)
        )}`
      );
    }
  }

  fixSchema(q, checkResult);

  try {
    await runMigrations(q, migrations, logger);
  } catch (e) {
    logger.error(`db migrations failed: ${e.stack}`);
  }
}

export default db;
