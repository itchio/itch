import * as squel from "squel";

import { DB } from ".";
import { Model } from "./model";

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
    return this.db.prepare(sql.text).get(...sql.values);
  }

  all(model: Model, cb: SelectCb = identity): any[] {
    const sql = cb(squel.select().from(model.table)).toParam();
    return this.db.prepare(sql.text).all(...sql.values);
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
