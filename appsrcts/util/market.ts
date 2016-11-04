
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

import {IEntityMap, ITableMap, IEntityRefs} from "../types/db";

interface IEntityRecords {
  entities: ITableMap;
}

/** options for deleting records */
interface IDeleteOpts {
  /** if true, delete waits for all changes to be committed to disk before resolving */
  wait?: boolean;
}

/** options for saving records */
interface ISaveOpts {
  /** if true, save waits for all changes to be committed before resolving */
  wait?: boolean;
  
  /** if true, save will persist changes to disk, not just in-memory */
  persist?: boolean;
  
  /** internal: set to true on the first saveAllEntities, which happens while loading the DB */
  initial?: boolean;
}

/**
 * Specifies what to delete from the DB
 */
interface IDeleteSpec {
  entities: IEntityRefs;
}

/**
 * MarketDB is a simple in-memory database that persists on disk.
 * It's about the simplest thing one could think of: file paths are
 * keys
 */
export default class Market extends EventEmitter {
  /** contents of the database */
  data: ITableMap;

  /** where the database is persisted on-disk */
  dbPath: string;

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

    this.dbPath = dbPath;
    const entities: ITableMap = {};

    const TMP_RE = /\.tmp\d+/;
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
      const contents = await sf.readFile(file);

      try {
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
    await sf.glob("*/*.tmp*", {cwd: this.getDbRoot()}).map(wipeTemp, {concurrency: 4});

    log(opts, `loading records for ${dbPath}`);
    await sf.glob("*/*", {cwd: this.getDbRoot()}).map(loadRecord, {concurrency: 4});

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
   * Saves all passed entity records. See ISaveOpts for disk persistence and other options.
   */
  async saveAllEntities (entityRecords: IEntityRecords, saveOpts = {} as ISaveOpts) {
    if (!this.dbPath) {
      return;
    }

    const {wait = false, persist = true, initial = false} = saveOpts;

    let promises = null as Array<Promise<any>>;
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
        const entity = entities[entityId];

        const record = table[entityId] || {};
        const same = every(Object.keys(entity), (key) => isEqual(entity[key], record[key]));

        if (!same) {
          const newRecord = deepFreeze(Object.assign({}, record, entity));
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
  async saveEntity (tableName: string, entityID: string, record: any, saveOpts = {} as ISaveOpts): Promise<void> {
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
  async deleteAllEntities (response: IDeleteSpec, deleteOpts = {} as IDeleteOpts) {
    const {wait = false} = deleteOpts;

    let promises = null as Array<Promise<any>>;
    if (wait) {
      promises = [];
    }

    for (const tableName of Object.keys(response.entities)) {
      const entities = response.entities[tableName];
      const table = this.data[tableName] || {};

      for (const entityId of entities) {
        delete table[entityId];

        const p = this.deleteFromDisk(tableName, entityId);
        if (promises) {
          promises.push(p);
        }
      }

      this.data[tableName] = table;
    }

    if (wait) {
      await bluebird.all(promises);
    }

    const deleted = response.entities;
    this.emit("commit", {deleted});
  }

  /**
   * Deletes a single entity, optionally from the disk store too, see IDeleteOpts
   */
  async deleteEntity (tableName: string, entityId: string, deleteOpts: IDeleteOpts) {
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
  getEntities (tableName: string): IEntityMap {
    // lazily creates table in 'data' object
    const entities = this.data[tableName] || {};
    this.data[tableName] = entities;
    return entities;
  }

  /**
   * Returns a specific entity of a given table, from the memory store.
   * Returns null if the entity does not exist.
   */
  getEntity (tableName: string, entityId: string): any {
    return this.getEntities(tableName)[entityId];
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
    await sf.writeFile(tmpPath, JSON.stringify(record));

    if (this.data[tableName] && this.data[tableName][entityId]) {
      await sf.rename(tmpPath, file);
    } else {
      // entity has been deleted in the meantime
      await sf.wipe(tmpPath);
    }
  }
}
