import * as Database from "better-sqlite3";
import * as hades from "./hades";
import Querier from "./querier";
import { runMigrations } from "./migrations";

import { modelMap, RepoContainer } from "./model-map";

if (process.type === "renderer") {
  throw new Error("can't require db from renderer.");
}

import { elapsed } from "../format";
import { dirname } from "path";
import * as sf from "../os/sf";

import rootLogger, { devNull } from "../logger";
const logger = rootLogger.child({ name: "db" });

import * as _ from "underscore";

import { globalDbPath } from "../os/paths";

import * as actions from "../actions";

import { IStore, IEntityMap, ITableMap, IDBDeleteSpec } from "../types";

const logSqlQueries = process.env.ITCH_SQL === "1";
const sqlLogger = logSqlQueries ? rootLogger.child({ name: "SQL" }) : devNull;

const emptyArr = [];

export interface IStatement {
  run(...args: any[]);
  get(...args: any[]): any;
  all(...args: any[]): any[];
}

export interface IConnection {
  prepare(sql: string): IStatement;
  close(): void;
}

/**
 * DB is a thin abstraction on top of typeorm. Pierce through it at will!
 */
export class DB extends RepoContainer {
  /** path to the sqlite file on disk */
  dbPath: string;
  private store: IStore;
  private conn: IConnection;

  /**
   * Loads the db from disk.
   */
  async load(store: IStore, dbPath: string): Promise<void> {
    this.store = store;

    logger.info(`connecting to db ${dbPath}`);
    const t1 = Date.now();
    this.dbPath = dbPath;

    if (!/^:.*:$/.test(dbPath)) {
      try {
        await sf.mkdir(dirname(this.dbPath));
      } catch (e) {
        logger.warn(`could not make db parent directory: ${e.stack}`);
      }
    }

    let opts: any = {};
    let fileName = this.dbPath;
    if (fileName === ":memory:") {
      fileName = "memory.db";
      opts.memory = true;
    }

    this.conn = new Database(fileName, opts);
    this.q = new Querier(this);

    // TODO: migrations yada yada

    this.setupRepos();
    await runMigrations(this);

    logger.info(`db connection established in ${elapsed(t1, Date.now())}`);
  }

  /* Data persistence / retrieval */

  /**
   * Saves all passed entity records. See opts type for disk persistence and other options.
   */
  saveMany(entityTables: ITableMap) {
    for (const tableName of Object.keys(entityTables)) {
      const entities: IEntityMap<Object> = entityTables[tableName];
      const entityIds = Object.keys(entities);

      const Model = modelMap[tableName];
      if (!Model) {
        logger.info(
          `Dunno how to persist ${tableName}, skipping ${entityIds.length} records`,
        );
        continue;
      }

      const oldRecordsList = this.q.all(Model, k =>
        k.whereIn(Model.primaryKey, entityIds),
      );
      const oldRecords = _.indexBy(oldRecordsList, Model.primaryKey);

      let numUpToDate = 0;
      const updated = [];
      this.q.withTransaction(() => {
        for (const id of entityIds) {
          let newRecord = entities[id];
          let oldRecord = oldRecords[id];
          if (oldRecord) {
            const update = hades.updateFor(oldRecord, newRecord, Model);
            if (update) {
              this.q.run(Model, k =>
                k.where(Model.primaryKey, id).update(update),
              );
              updated.push(id);
            } else {
              numUpToDate++;
            }
          } else {
            const insert = hades.insertFor(
              {
                ...newRecord,
                [Model.primaryKey]: id,
              },
              Model,
            );
            this.q.run(Model, k => k.insert(insert));
            updated.push(id);
          }
        }
      });

      if (updated.length > 0) {
        this.store.dispatch(
          actions.dbCommit({
            tableName,
            updated,
            deleted: emptyArr,
          }),
        );
      }
      logger.info(
        `${entityIds.length -
          numUpToDate}/${entityIds.length} new/modified ${tableName}`,
      );
    }
  }

  /**
   * Save a single entity to the db, optionally persisting to disk (see ISaveOpts).
   */
  saveOne<T>(tableName: string, id: string | number, record: Partial<T>): void {
    this.saveMany({
      [tableName]: {
        [id]: record,
      },
    });
  }

  /**
   * Delete all referenced entities. See IDeleteOpts for options.
   */
  deleteAllEntities(deleteSpec: IDBDeleteSpec) {
    for (const tableName of Object.keys(deleteSpec.entities)) {
      const ids = deleteSpec.entities[tableName];

      const Model = modelMap[tableName];
      if (!Model) {
        logger.info(
          `Dunno how to persist ${tableName}, skipping delete of ${ids.length} items`,
        );
        continue;
      }

      this.q.run(Model, k => k.whereIn(Model.primaryKey, ids).delete());

      this.store.dispatch(
        actions.dbCommit({
          tableName,
          updated: emptyArr,
          deleted: ids,
        }),
      );
    }
  }

  /**
   * Deletes a single entity, optionally from the disk store too, see opts type
   */
  deleteEntity(tableName: string, id: string) {
    const Model = modelMap[tableName];
    if (!Model) {
      logger.info(`Dunno how to persist ${tableName}, skipping single delete`);
      return;
    }

    this.q.run(Model, k => k.where({ [Model.primaryKey]: id }).delete());

    this.store.dispatch(
      actions.dbCommit({
        tableName,
        updated: emptyArr,
        deleted: [id],
      }),
    );
  }

  /**
   * After closing the DB, no methods may called on it any more.
   */
  async close() {
    logger.info(`closing db ${this.dbPath}`);
    const t1 = Date.now();
    this.conn.close();
    logger.info(`closed db in ${elapsed(t1, Date.now())}`);
    this.dbPath = null;
  }

  prepare(sql: string): IStatement {
    if (logSqlQueries) {
      sqlLogger.warn(sql);
      const transaction = this.conn.prepare(sql);
      const originalGet = transaction.get;
      transaction.get = (...bindings: any[]): any => {
        sqlLogger.warn(`GET ${JSON.stringify(bindings)}`);
        return originalGet.call(transaction, bindings);
      };

      const originalAll = transaction.all;
      transaction.all = (...bindings: any[]): any[] => {
        sqlLogger.warn(`ALL ${JSON.stringify(bindings)}`);
        return originalAll.call(transaction, bindings);
      };

      const originalRun = transaction.run;
      transaction.run = (...bindings: any[]) => {
        sqlLogger.warn(`RUN ${JSON.stringify(bindings)}`);
        return originalRun.call(transaction, bindings);
      };
      return transaction;
    }
    return this.conn.prepare(sql);
  }

  getConnection() {
    return this.conn;
  }
}

let db = new DB();

export async function connectDatabase(store: IStore) {
  await db.load(store, globalDbPath());
}

export default db;
