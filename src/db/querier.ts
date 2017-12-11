import * as squel from "squel";

import { DB } from ".";
import { Model } from "./model";
import expandFields from "./expand-fields";

export type SelectCb = (k: squel.Select) => squel.Select;
export type DeleteCb = (k: squel.Delete) => squel.Delete;
export type InsertCb = (k: squel.Insert) => squel.Insert;
export type UpdateCb = (k: squel.Update) => squel.Update;

const identity = x => x;

export default class Querier {
  constructor(private db: DB) {}

  withTransaction(cb: () => void) {
    this.db.prepare("BEGIN").run();
    try {
      cb();
      this.db.prepare("COMMIT").run();
    } catch (e) {
      this.db.prepare("ROLLBACK").run();
      throw e;
    }
  }

  async withTransactionAsync(cb: () => Promise<void>) {
    this.db.prepare("BEGIN").run();
    try {
      await cb();
      this.db.prepare("COMMIT").run();
    } catch (e) {
      this.db.prepare("ROLLBACK").run();
      throw e;
    }
  }

  get(model: Model, cb: SelectCb): any {
    const sql = cb(squel.select().from(model.table)).toParam();
    const res = this.db.prepare(sql.text).get(...sql.values);
    if (res) {
      expandFields(res, model);
    }
    return res;
  }

  all(model: Model, cb: SelectCb = identity): any[] {
    const sql = cb(squel.select().from(model.table)).toParam();
    const records = this.db.prepare(sql.text).all(...sql.values);
    for (const record of records) {
      expandFields(record, model);
    }
    return records;
  }

  /**
   * Fetches many instances of a model by its primary key
   * Paginates if needed to respect SQLite limits
   */
  allByKeySafe(model: Model, primaryKeys: any[]): any[] {
    let res: any[] = [];
    // actually defaults to 999 in SQLite: https://sqlite.org/limits.html
    // but better safe than sorry
    const maxParamsByQuery = 900;

    let offset = 0;
    while (offset < primaryKeys.length) {
      let queryLength = primaryKeys.length - offset;
      if (queryLength > maxParamsByQuery) {
        queryLength = maxParamsByQuery;
      }

      let queryKeys = primaryKeys.slice(offset, offset + queryLength);
      res = [
        ...res,
        ...this.all(model, k => k.where(`${model.primaryKey} in ?`, queryKeys)),
      ];

      offset += queryLength;
    }
    return res;
  }

  update(model: Model, cb: UpdateCb): void {
    const sql = cb(squel.update().table(model.table)).toParam();
    this.db.prepare(sql.text).run(...sql.values);
  }

  insert(model: Model, cb: InsertCb): void {
    const sql = cb(squel.insert().into(model.table)).toParam();
    this.db.prepare(sql.text).run(...sql.values);
  }

  delete(model: Model, cb: DeleteCb): void {
    const sql = cb(squel.delete().from(model.table)).toParam();
    this.db.prepare(sql.text).run(...sql.values);
  }

  runSql(sql: squel.ParamString): void {
    this.db.prepare(sql.text).run(...sql.values);
  }

  runManySql(sqls: squel.ParamString[]): void {
    for (const sql of sqls) {
      this.runSql(sql);
    }
  }

  allSql(sql: squel.ParamString): any[] {
    return this.db.prepare(sql.text).all(...sql.values);
  }

  getDB(): DB {
    return this.db;
  }
}
