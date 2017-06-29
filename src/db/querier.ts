import * as Knex from "knex";
export const knex = Knex({ client: "sqlite3", useNullAsDefault: true });

export type QueryBuilder = Knex.QueryBuilder;
export type QueryInterface = Knex.QueryInterface;

import { DB } from ".";
import { Model } from "./model";

export type KnexCb = (k: Knex.QueryInterface) => Knex.QueryBuilder;

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

  get(model: Model, cb: KnexCb): any {
    const sql = cb(knex(model.table)).toSQL();
    return this.db.prepare(sql.sql).get(...sql.bindings);
  }

  all(model: Model, cb: KnexCb): any[] {
    const sql = cb(knex(model.table)).toSQL();
    return this.db.prepare(sql.sql).all(...sql.bindings);
  }

  run(model: Model, cb: KnexCb): void {
    const sql = cb(knex(model.table)).toSQL();
    this.db.prepare(sql.sql).run(...sql.bindings);
  }
}
