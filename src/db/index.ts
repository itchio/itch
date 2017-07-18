import { DB } from "./db";
import {
  runMigrations,
  checkSchema,
  hasSchemaErrors,
  fixSchema,
} from "./migrator";
import { modelMap } from "./repository";
import migrations from "./migrations";
export * from "./db";

import { IStore } from "../types";
import { globalDbPath } from "../os/paths";
import rootLogger from "../logger";
const logger = rootLogger.child({ name: "db" });

let db = new DB(modelMap);

export async function connectDatabase(store: IStore) {
  const dbPath = globalDbPath();
  logger.info(`connecting to db ${dbPath}`);

  db.load(store, dbPath);

  const q = db.getQuerier();

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
  }

  fixSchema(q, checkResult);

  try {
    await runMigrations(q, migrations, logger);
  } catch (e) {
    logger.error(`db migrations failed: ${e.stack}`);
  }
}

export default db;
