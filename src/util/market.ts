
import * as bluebird from "bluebird";
import {camelify, elapsed} from "./format";

import * as path from "path";
import sf from "./sf";
import mklog from "./log";
const log = mklog("market");
const opts = {logger: new mklog.Logger()};

import {EventEmitter} from "events";

import {
  createConnection,
  Connection, ObjectType, Repository,
  getMetadataArgsStorage,
} from "typeorm";
import GameModel from "../models/game";
import CollectionModel from "../models/collection";
import DownloadKeyModel from "../models/download-key";
import CaveModel from "../models/cave";

import compareRecords from "./compare-records";
import * as _ from "underscore";

import {
  IEntityMap, ITableMap, IEntityRecords,
  IMarketDeleteSpec,
  IMarket,
} from "../types";

interface IModelMap {
  [key: string]: Function;
}

const modelMap: IModelMap = {
  "games": GameModel,
  "collections": CollectionModel,
  "downloadKeys": DownloadKeyModel,
  "caves": CaveModel,
};

/**
 * MarketDB is a simple in-memory database that persists on disk.
 * It's about the simplest thing one could think of: file paths are
 * keys
 */
export default class Market extends EventEmitter implements IMarket {
  conn: Connection;

  /** where the database is persisted on-disk */
  dbPath: string;

  /** if set, saves records to disk */
  persist: boolean;

  /** returns a new, not-loaded-yet db */
  constructor () {
    super();
  }

  /**
   * loads the db from disk.
   * @param dbPath Where to load the DB from, and persist later when records are updated
   */
  async load (dbPath: string): Promise<void> {
    log(opts, `loading market db from ${dbPath}`);
    this.dbPath = dbPath;

    // sqlite init
    this.conn = await createConnection({
      name: dbPath,
      driver: {
        type: "sqlite",
        storage: dbPath + ".db",
      },
      logging: {
        logQueries: process.env.ITCH_SQL === "1",
      },
      entities: Object.keys(modelMap).map((k) => modelMap[k]),
      autoSchemaSync: true,
    });

    this.emit("ready");
    log(opts, `market ready! ${dbPath}`);
  }

  async oldLoad() {
    this.persist = true;
    const entities: ITableMap<any> = {};

    const TMP_RE = /\.tmp\d+/;
    let numRecords = 0;
    const loadRecord = async function (recordPath: string): Promise<void> {
      if (TMP_RE.test(recordPath)) {
        // timing issue: the session is being written to while the DB is loading
        // cf. https://github.com/itchio/itch/issues/831
        return;
      }

      const tokens = recordPath.split("/");
      const [tableName, entityId] = tokens;
      const camelTableName = camelify(tableName);
      entities[camelTableName] = entities[camelTableName] || {};

      const file = path.join(this.dbPath, recordPath);
      const contents = await sf.readFile(file, {encoding: "utf8"});

      try {
        numRecords++;
        entities[camelTableName][entityId] = JSON.parse(contents);
      } catch (e) {
        log(opts, `warning: skipping record ${tableName}/${entityId} (${e})`);
        return;
      }
    };

    const wipeTemp = async function (recordPath: string): Promise<void> {
      const file = path.join(this.dbPath, recordPath);
      await sf.wipe(file);
    };

    log(opts, `cleaning temporary files from ${this.dbPath}`);
    const tempFiles = sf.glob("*/*.tmp*", {cwd: this.getDbRoot()});
    await bluebird.map(tempFiles, wipeTemp, {concurrency: 4});

    log(opts, `loading records for ${this.dbPath}`);
    const recordFiles = sf.glob("*/*", {cwd: this.getDbRoot()});
    const t1 = Date.now();
    await bluebird.map(recordFiles, loadRecord, {concurrency: 4});
    const t2 = Date.now();
    log(opts, `loaded ${numRecords} records in ${elapsed(t1, t2)}`);

    log(opts, "populating in-memory DB with disk records");
    await this.saveAllEntities({entities});

    log(opts, `done loading db from ${this.dbPath}`);
    this.emit("ready");
  }

  /**
   * Returns the directory this database persists to, or throws
   * if it hasn't been initialized yet
   */
  getDbRoot () {
    if (!this.dbPath) {
      throw new Error("tried to get db root before it was set");
    }

    return this.dbPath;
  }

  /* Data persistence / retrieval */

  /**
   * Saves all passed entity records. See opts type for disk persistence and other options.
   */
  async saveAllEntities <T> (entityRecords: IEntityRecords<T>) {
    for (const tableName of Object.keys(entityRecords.entities)) {
      const t1 = Date.now();
      const entities: IEntityMap<Object> = entityRecords.entities[tableName];
      const entityIds = Object.keys(entities);

      const Model = modelMap[tableName];
      if (!Model) {
        log(opts, `Dunno how to persist ${tableName}, skipping ${entityIds.length} records`);
        continue;
      }
      const columns = getColumns(Model);

      const repo = this.conn.getRepository(Model);

      const t2 = Date.now();

      const savedRows = await repo
        .createQueryBuilder("g")
        .where("g.id in (:entityIds)", {entityIds})
        .getMany();
      const existingEntities = _.indexBy(savedRows, "id");

      const t3 = Date.now();

      let rows = [];
      let numUpToDate = 0;
      for (const id of entityIds) {
        let entity = entities[id];
        let existingEntity = existingEntities[id];
        if (existingEntity) {
          if (compareRecords(existingEntity, entity, columns)) {
            numUpToDate++;
            continue;
          }
          rows.push(repo.merge(entity));
        } else {
          existingEntity = repo.create(entity);
          (existingEntity as any).id = id;
          rows.push(existingEntity);
        }
      }

      const t4 = Date.now();

      if (rows.length > 0) {
        await repo.persist(rows);
      }
      const t5 = Date.now();
      log(opts, `saved ${entityIds.length - numUpToDate}/${entityIds.length}`
        + ` ${tableName}, skipped ${numUpToDate} up-to-date\n`
        + `prep ${elapsed(t1, t2)}, quer ${elapsed(t2, t3)}, `
        + `comp ${elapsed(t3, t4)}, save ${elapsed(t4, t5)}`);
    }

    this.emit("commit", {updated: {}});
  }

  /**
   * Save a single entity to the db, optionally persisting to disk (see ISaveOpts).
   */
  async saveEntity <T> (tableName: string, id: string, record: Partial<T>): Promise<void> {
    const Model = modelMap[tableName];
    if (!Model) {
      log(opts, `Dunno how to persist ${tableName}, skipping single record`);
      return;
    }

    const repo = this.conn.getRepository(Model);
    const entity = repo.create(record as any);
    (entity as any).id = id;
    await repo.persist(entity);
  }

  /**
   * Delete all referenced entities. See IDeleteOpts for options.
   */
  async deleteAllEntities (deleteSpec: IMarketDeleteSpec) {
    for (const tableName of Object.keys(deleteSpec.entities)) {
      const entities = deleteSpec.entities[tableName];

      const Model = modelMap[tableName];
      if (!Model) {
        log(opts, `Dunno how to persist ${tableName}, skipping delete of ${entities.length} items`);
        continue;
      }
      const repo = this.conn.getRepository(Model);

      const toRemove = [];      
      for (const id of entities) {
        toRemove.push({id});
      }
      await repo.remove(toRemove);
    }

    const deleted = deleteSpec.entities;
    this.emit("commit", {deleted});
  }

  /**
   * Deletes a single entity, optionally from the disk store too, see opts type
   */
  async deleteEntity (tableName: string, id: string) {
    const Model = modelMap[tableName];
    if (!Model) {
      log(opts, `Dunno how to persist ${tableName}, skipping single delete`);
      return;
    }
    const repo = this.conn.getRepository(Model);
    await repo.remove({id});

    this.emit("commit", {deleted: [id]});
  }

  /**
   * Returns all entities of a given table, from the memory store.
   * Returns an empty IEntityMap if the table does not exist.
   */
  getEntities <T> (tableName: string): IEntityMap<T> {
    const shortStack = (new Error().stack).split("\n").slice(1, 4).join("\n");
    log(opts, `getEntities called from ${shortStack}`);
    return {};
  }

  /**
   * Returns a specific entity of a given table, from the memory store.
   * Returns null if the entity does not exist.
   */
  getEntity <T> (tableName: string, entityId: string): T {
    const shortStack = (new Error().stack).split("\n").slice(1, 4).join("\n");
    log(opts, `getEntity called from ${shortStack}`);
    return null;
  }

  getRepo <T> (model: ObjectType<T>): Repository<T> {
    return this.conn.getRepository(model);
  }

  /**
   * After closing the DB, no methods may called on it any more.
   */
  async close () {
    log(opts, `closing db ${this.dbPath}`);
    await this.conn.close();
    this.emit("close");
    this.dbPath = null;
  }

  /** Returns the path an entity is stored in */
  protected entityPath (tableName: string, entityId: string): string {
    return path.join(this.getDbRoot(), `${tableName}/${entityId}`);
  }
}

const columnsCache = new Map<Function, Set<string>>();

export function getColumns (model: Function): Set<string> {
  const cached = columnsCache.get(model);
  if (cached) {
    return cached;
  }

  const storage = getMetadataArgsStorage();
  const columns = storage.columns.filterByTarget(model);
  const set = new Set(_.pluck(columns.toArray(), "propertyName"));
  columnsCache.set(model, set);
  return set;
}
