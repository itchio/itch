import * as Database from "better-sqlite3";
import * as hades from "./hades";
import Querier from "./querier";
import { RepoContainer, IModelMap } from "./repository";

import { dirname } from "path";
import { sync as mkdirp } from "mkdirp";

import { indexBy } from "underscore";
import { actions } from "../actions";

export interface IStatement {
  run(...args: any[]);
  get(...args: any[]): any;
  all(...args: any[]): any[];
}

export interface IConnection {
  prepare(sql: string): IStatement;
  close(): void;
}

import {
  IStore,
  IEntityMap,
  ITableMap,
  IDBDeleteSpec,
  IDownloadItem,
} from "../types";

import rootLogger, { devNull } from "../logger";
import { Game, User } from "ts-itchio-api";
import { ICave } from "./models/cave";
import { ICollection } from "./models/collection";
const logger = rootLogger.child({ name: "db" });

const logSqlQueries = process.env.ITCH_SQL === "1";
const sqlLogger = logSqlQueries ? rootLogger.child({ name: "SQL" }) : devNull;

const emptyArr = [];

/**
 * DB is a thin abstraction on top of typeorm. Pierce through it at will!
 */
export class DB extends RepoContainer {
  /** path to the sqlite file on disk */
  dbPath: string;
  protected q: Querier;
  private conn: IConnection;
  private store: IStore;

  constructor(public modelMap: IModelMap) {
    super();
  }

  /**
   * Loads the db from disk.
   */
  async load(store: IStore, dbPath: string): Promise<void> {
    if (process.type === "renderer") {
      throw new Error("Refusing to load DB from renderer");
    }

    this.store = store;

    this.dbPath = dbPath;

    if (!/^:.*:$/.test(dbPath)) {
      try {
        mkdirp(dirname(this.dbPath));
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

    this.setupRepos();
  }

  /* Data persistence / retrieval */

  /**
   * Saves all passed entity records. See opts type for disk persistence and other options.
   */
  saveMany(entityTables: ITableMap) {
    for (const tableName of Object.keys(entityTables)) {
      const entities: IEntityMap<Object> = entityTables[tableName];
      const entityIds = Object.keys(entities);

      const Model = this.modelMap[tableName];
      if (!Model) {
        logger.info(
          `Dunno how to persist ${tableName}, skipping ${entityIds.length} records`
        );
        continue;
      }

      let numUpToDate = 0;
      const updated = [];
      this.q.withTransaction(() => {
        logger.debug(
          `Fetching ${entityIds.length} old entities from ${Model.table}`
        );
        const oldRecordsList = this.q.allByKeySafe(Model, entityIds);
        logger.debug(
          `Got ${oldRecordsList.length} old entities from ${Model.table}`
        );
        const oldRecords = indexBy(oldRecordsList, Model.primaryKey);

        for (const id of entityIds) {
          let newRecord = entities[id];
          let oldRecord = oldRecords[id];
          if (oldRecord) {
            const update = hades.updateFor(oldRecord, newRecord, Model);
            if (update) {
              this.q.update(Model, k =>
                k.where(`${Model.primaryKey} = ?`, id).setFields(update)
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
              Model
            );
            this.q.insert(Model, k => k.setFields(insert));
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
          })
        );
      }

      if (numUpToDate < entityIds.length) {
        logger.debug(
          `${entityIds.length -
            numUpToDate}/${entityIds.length} new/modified ${tableName}`
        );
      }
    }
  }

  /**
   * Save a single entity to the db, optionally persisting to disk (see ISaveOpts).
   */
  saveOne(tableName: "games", id: string | number, record: Partial<Game>): void;
  saveOne(tableName: "user", id: string | number, record: Partial<User>): void;
  saveOne(
    tableName: "downloads",
    id: string | number,
    record: Partial<IDownloadItem>
  ): void;
  saveOne(
    tableName: "collection",
    id: string | number,
    record: Partial<ICollection>
  ): void;
  saveOne(
    tableName: "caves",
    id: string | number,
    record: Partial<ICave>
  ): void;
  saveOne<T>(tableName: string, id: string | number, record: Partial<T>): void;

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

      const Model = this.modelMap[tableName];
      if (!Model) {
        logger.info(
          `Dunno how to persist ${tableName}, skipping delete of ${ids.length} items`
        );
        continue;
      }

      this.q.delete(Model, k => k.where(`${Model.primaryKey} in ?`, ids));

      this.store.dispatch(
        actions.dbCommit({
          tableName,
          updated: emptyArr,
          deleted: ids,
        })
      );
    }
  }

  /**
   * Deletes a single entity, optionally from the disk store too, see opts type
   */
  deleteEntity(tableName: string, id: string) {
    const Model = this.modelMap[tableName];
    if (!Model) {
      logger.info(`Dunno how to persist ${tableName}, skipping single delete`);
      return;
    }

    this.q.delete(Model, k => k.where(`${Model.primaryKey} = ?`, id));

    this.store.dispatch(
      actions.dbCommit({
        tableName,
        updated: emptyArr,
        deleted: [id],
      })
    );
  }

  /**
   * After closing the DB, no methods may called on it anymore.
   */
  close() {
    this.conn.close();
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

  getQuerier() {
    return this.q;
  }
}
