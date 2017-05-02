
import * as bluebird from "bluebird";
import {camelify} from "./format";

import * as path from "path";
import sf from "./sf";
import mklog from "./log";
const log = mklog("market");
const opts = {logger: new mklog.Logger()};

import * as deepFreeze from "deep-freeze";
import {isEqual, every} from "underscore";

import {EventEmitter} from "events";

import {createConnection, Connection} from "typeorm";
import GameModel from "../models/game";

import {
  IEntityMap, ITableMap, IEntityRefs, IEntityRecords,
  IMarketSaveOpts, IMarketDeleteOpts, IMarketDeleteSpec,
  IMarket,

  IGameRecord,
} from "../types";

const useSqlite = process.env.ITCH_SQLITE === "1";

/**
 * MarketDB is a simple in-memory database that persists on disk.
 * It's about the simplest thing one could think of: file paths are
 * keys
 */
export default class Market extends EventEmitter implements IMarket {
  conn: Connection;

  /** contents of the database */
  data: ITableMap<any>;

  /** where the database is persisted on-disk */
  dbPath: string;

  /** if set, saves records to disk */
  persist: boolean;

  /** internal: used for generating temporary file paths */
  private atomicInvocations: number;

  /** returns a new, not-loaded-yet db */
  constructor () {
    super();
    this.data = {};
    this.atomicInvocations = 0;
  }

  /**
   * loads the db from disk.
   * @param dbPath Where to load the DB from, and persist later when records are updated
   */
  async load (dbPath: string): Promise<void> {
    log(opts, `loading market db from ${dbPath}`);

    if (useSqlite) {
      this.conn = await createConnection({
        name: dbPath,
        driver: {
          type: "sqlite",
          storage: dbPath + ".sqlite",
        },
        entities: [GameModel],
        autoSchemaSync: true,
      });

      // load games
      {
        const t1 = Date.now();
        const gameRepo = this.conn.getRepository(GameModel);
        const games = await gameRepo.find();
        const t2 = Date.now();
        this.data = {games: {}};

        const updated = {games: [] as any};
        const initial = true;
        for (const game of games) {
          this.data.games[game.id] = game.toRecord();
          updated.games.push(game.id);
        }
        this.emit("commit", {updated, initial});
        const t3 = Date.now();
        log(opts, `Loaded ${games.length} games in ${(t2 - t1).toFixed(2)} ms`);
        log(opts, `Saved in memory in ${(t3 - t2).toFixed(2)} ms`);
      }

      this.emit("ready");
      return;
    }

    this.dbPath = dbPath;
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

      const file = path.join(dbPath, recordPath);
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
      const file = path.join(dbPath, recordPath);
      await sf.wipe(file);
    };

    log(opts, `cleaning temporary files from ${dbPath}`);
    const tempFiles = sf.glob("*/*.tmp*", {cwd: this.getDbRoot()});
    await bluebird.map(tempFiles, wipeTemp, {concurrency: 4});

    log(opts, `loading records for ${dbPath}`);
    const recordFiles = sf.glob("*/*", {cwd: this.getDbRoot()});
    const t1 = Date.now();
    await bluebird.map(recordFiles, loadRecord, {concurrency: 4});
    const t2 = Date.now();
    log(opts, `loaded ${numRecords} records in ${t2 - t1} ms`);

    log(opts, "populating in-memory DB with disk records");
    await this.saveAllEntities({entities}, {persist: false, initial: true});

    log(opts, `done loading db from ${dbPath}`);
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
  async saveAllEntities <T> (entityRecords: IEntityRecords<T>, saveOpts = {} as IMarketSaveOpts) {
    if (useSqlite) {
      for (const tableName of Object.keys(entityRecords.entities)) {
        if (tableName === "games") {
          const gameRepo = this.conn.getRepository(GameModel);
          const entities = entityRecords.entities[tableName];
          const entityIds = Object.keys(entities);
          log(opts, `Should save ${entityIds.length} game!`);

          let gameModels = [];
          for (const entityId of entityIds) {
            const game = entities[entityId] as any as IGameRecord;
            const gameModel = gameRepo.create(game);
            gameModels.push(gameModel);
          }
          const t1 = Date.now();
          await gameRepo.persist(gameModels);
          const t2 = Date.now();
          log(opts, `Saved ${entityIds.length} games in ${(t2 - t1).toFixed(2)} ms`);
        }
      }

      return;
    }

    if (this.persist && !this.dbPath) {
      return;
    }

    const {wait = false, persist = this.persist, initial = false} = saveOpts;

    let promises = null as Promise<any>[];
    if (wait) {
      promises = [];
    }

    const updated: IEntityRefs = {};

    for (const tableName of Object.keys(entityRecords.entities)) {
      const entities = entityRecords.entities[tableName];
      let table = this.data[tableName] || {};
      updated[tableName] = updated[tableName] || [];

      for (const entityId of Object.keys(entities)) {
        updated[tableName].push(entityId);
        const entity = entities[entityId] as any;

        const record = table[entityId] || {};
        const same = every(Object.keys(entity), (key) => isEqual(entity[key], record[key]));

        if (!same) {
          const newRecord = deepFreeze({...record, ...entity});
          table[entityId] = newRecord;

          if (persist) {
            let p = this.saveToDisk(tableName, entityId, newRecord);
            if (wait) {
              promises.push(p);
            }
          }
        }
      }

      this.data[tableName] = table;
    }

    if (wait) {
      await bluebird.all(promises);
    }

    this.emit("commit", {updated, initial});
  }

  /**
   * Save a single entity to the db, optionally persisting to disk (see ISaveOpts).
   */
  async saveEntity <T> (
      tableName: string, entityID: string, record: Partial<T>,
      saveOpts = {} as IMarketSaveOpts): Promise<void> {
    // console.log(`saveEntity ${tableName}/${entityID}:\n\n${JSON.stringify(record, null, 2)}`);

    const entityRecords = {
      entities: {
        [tableName]: { [entityID]: record },
      },
    };
    return await this.saveAllEntities(entityRecords, saveOpts);
  }

  /**
   * Delete all referenced entities. See IDeleteOpts for options.
   */
  async deleteAllEntities (deleteSpec: IMarketDeleteSpec, deleteOpts = {} as IMarketDeleteOpts) {
    const {wait = false} = deleteOpts;
    const {persist} = this;

    let promises = null as Promise<any>[];
    if (wait) {
      promises = [];
    }

    for (const tableName of Object.keys(deleteSpec.entities)) {
      const entities = deleteSpec.entities[tableName];
      const table = this.data[tableName] || {};

      for (const entityId of entities) {
        delete table[entityId];

        if (persist) {
          const p = this.deleteFromDisk(tableName, entityId);
          if (promises) {
            promises.push(p);
          }
        }
      }

      this.data[tableName] = table;
    }

    if (wait) {
      await bluebird.all(promises);
    }

    const deleted = deleteSpec.entities;
    this.emit("commit", {deleted});
  }

  /**
   * Deletes a single entity, optionally from the disk store too, see opts type
   */
  async deleteEntity (tableName: string, entityId: string, deleteOpts: IMarketDeleteOpts) {
    await this.deleteAllEntities({
      entities: {
        [tableName]: [entityId],
      },
    }, deleteOpts);
  }

  /**
   * Returns all entities of a given table, from the memory store.
   * Returns an empty IEntityMap if the table does not exist.
   */
  getEntities <T> (tableName: string): IEntityMap<T> {
    // lazily creates table in 'data' object
    const entities = this.data[tableName] || {};
    this.data[tableName] = entities;
    return entities;
  }

  /**
   * Returns a specific entity of a given table, from the memory store.
   * Returns null if the entity does not exist.
   */
  getEntity <T> (tableName: string, entityId: string): T {
    return this.getEntities<T>(tableName)[entityId];
  }

  /**
   * Remove all records from memory - doesn't wipe the disk store
   */
  clear () {
    this.data = {};
  }

  /**
   * After closing the DB, no methods may called on it any more.
   */
  close () {
    log(opts, `closing db ${this.dbPath}`);
    this.clear();
    this.emit("close");
    this.dbPath = null;
  }

  /** Removes an entity from the disk store */
  protected async deleteFromDisk (tableName: string, entityId: string): Promise<void> {
    await sf.wipe(this.entityPath(tableName, entityId));
  }

  /** Returns the path an entity is stored in */
  protected entityPath (tableName: string, entityId: string): string {
    return path.join(this.getDbRoot(), `${tableName}/${entityId}`);
  }
  
  /** Saves a given entity to disk */
  protected async saveToDisk (tableName: string, entityId: string, record: any): Promise<void> {
    const file = this.entityPath(tableName, entityId);
    const tmpPath = file + ".tmp" + (this.atomicInvocations++);
    const contents = JSON.stringify(record);
    await sf.writeFile(tmpPath, contents, {encoding: "utf8"});

    if (this.data[tableName] && this.data[tableName][entityId]) {
      try {
        await sf.rename(tmpPath, file);
      } catch (e) {
        log(opts, `Could not save ${tmpPath}: ${e.message}`);
        await sf.wipe(tmpPath);
      }
    } else {
      // entity has been deleted in the meantime
      await sf.wipe(tmpPath);
    }
  }
}
