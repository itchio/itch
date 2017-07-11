import * as Knex from "knex";
import { knex } from "./querier";
import { Model, Column } from "./model";
import Querier from "./querier";
import { DB } from ".";

import { sortBy, indexBy, pluck, filter } from "underscore";

import { toDateTimeField } from "./datetime-field";

interface IMigrator {
  db: DB;
  createTable: <T>(model: Model, cb: (t: ITableBuilder<T>) => void) => void;
}

interface IMigration {
  (m: IMigrator): void;
}

export interface IMigrations {
  [key: number]: IMigration;
}

interface ITableBuilder<T> {
  integer(name: keyof T): Knex.ColumnBuilder;
  text(name: keyof T): Knex.ColumnBuilder;
  json(name: keyof T): Knex.ColumnBuilder;
  boolean(name: keyof T): Knex.ColumnBuilder;
  dateTime(name: keyof T): Knex.ColumnBuilder;
}

// Knex typings forgot about this lil' important part
type RealSchemaBuilder = Knex.SchemaBuilder & {
  toSQL(): Knex.Sql[];
};

const migrationsTable = "__itch_migrations";
export function runMigrations(q: Querier, migrations: IMigrations) {
  ensureMigrationsTable(q);
  const pending = pendingMigrations(q, migrations);

  if (pending.length === 0) {
    return;
  }

  const migrator: IMigrator = {
    createTable: (model: Model, cb) => {
      q.runManySql(
        (knex.schema.createTable(model.table, function(this) {
          cb(this);
        }) as RealSchemaBuilder).toSQL(),
      );
    },
    db: q.getDB(),
  };

  for (const id of pending) {
    q.withTransaction(() => {
      const migration = migrations[id];
      migration(migrator);
      markMigrated(q, id);
    });
  }
}

function ensureMigrationsTable(q: Querier) {
  q.runManySql(
    (knex.schema.createTableIfNotExists(migrationsTable, function(
      this: Knex.TableBuilder,
    ) {
      this.integer("id");
      this.dateTime("migratedAt");
    }) as RealSchemaBuilder).toSQL(),
  );
}

function pendingMigrations(q: Querier, migrations: IMigrations): string[] {
  const doneMigrations = q.allSql(knex(migrationsTable).select().toSQL());
  const doneById = indexBy(doneMigrations, "id");

  // all migration ids
  let ids = Object.keys(migrations);
  // sorted by ids (which are timestamps)
  ids = sortBy(ids, x => x);

  const todo = [];
  for (const id of ids) {
    if (!doneById[id]) {
      todo.push(id);
    }
  }

  return todo;
}

function markMigrated(q: Querier, id: string) {
  q.runSql(
    knex(migrationsTable)
      .insert({
        id,
        migratedAt: toDateTimeField(new Date()),
      })
      .toSQL(),
  );
}

export function markAllMigrated(q: Querier, migrations: IMigrations) {
  ensureMigrationsTable(q);
  q.withTransaction(() => {
    for (const id of pendingMigrations(q, migrations)) {
      markMigrated(q, id);
    }
  });
}

interface IModelMap {
  [key: string]: Model;
}

interface ICheckSchemaResult {
  toCreate: {
    model: Model;
  }[];
  toSync: {
    model: Model;
    existingColumns: string[];
  }[];
}

export function hasSchemaErrors(res: ICheckSchemaResult) {
  if (res.toCreate.length > 0) {
    return true;
  }
  if (res.toSync.length > 0) {
    return true;
  }
  return false;
}

/**
 * Check that the DB schema matches our expectations.
 * If tables or columns are missing
 */
export function checkSchema(
  q: Querier,
  modelMap: IModelMap,
): ICheckSchemaResult {
  const result: ICheckSchemaResult = {
    toCreate: [],
    toSync: [],
  };

  for (const table of Object.keys(modelMap)) {
    const model = modelMap[table];
    if (table !== model.table) {
      throw new Error(
        `Internal inconsistency: modelMap key is ${table}, model table is ${model.table}`,
      );
    }

    const exists = q
      .getDB()
      .prepare(`SELECT name FROM sqlite_master WHERE type="table" AND name=?`)
      .get(model.table);
    if (!exists) {
      result.toCreate.push({ model: model });
      continue;
    }

    const dbColumns = q
      .getDB()
      .prepare(`PRAGMA table_info(${model.table})`)
      .all();
    const byName = indexBy(dbColumns, "name");

    let hadIncorrectColumns = false;

    const { columns } = model;
    for (const column of Object.keys(columns)) {
      const columnType = columns[column];
      const dbColumn = byName[column];
      if (!dbColumn) {
        hadIncorrectColumns = true;
        continue;
      }

      const dbType = dbColumn.type.toLowerCase();
      const assertType = (actual: string, expected: string) => {
        if (expected !== actual) {
          hadIncorrectColumns = true;
        }
      };

      assertType(dbType, sqliteColumnType(columnType));
    }

    if (hadIncorrectColumns) {
      // we don't care about columns that disappeared
      const existingColumns = filter(pluck(dbColumns, "name"), columnName =>
        model.columns.hasOwnProperty(columnName),
      );
      result.toSync.push({ model, existingColumns });
    }
  }

  return result;
}

export function fixSchema(q: Querier, checkResult: ICheckSchemaResult) {
  for (const createItem of checkResult.toCreate) {
    const { model } = createItem;
    createTableForModel(q, model);
  }

  for (const syncItem of checkResult.toSync) {
    const { model, existingColumns } = syncItem;
    const conn = q.getDB().getConnection();
    q.withTransaction(() => {
      const tempName = "__itch_migrator_temp";

      conn.prepare("pragma foreign_keys = 0").run();
      conn
        .prepare(`create table ${tempName} as select * from ${model.table}`)
        .run();
      conn.prepare(`drop table ${model.table}`).run();

      createTableForModel(q, model);

      conn
        .prepare(
          `insert into ${model.table} (${existingColumns.join(
            ", ",
          )}) select ${existingColumns.join(", ")} from ${tempName}`,
        )
        .run();

      conn.prepare(`drop table ${tempName}`).run();

      conn.prepare("pragma foreign_keys = 1").run();
    });
  }
}

function createTableForModel(q: Querier, model: Model) {
  q.runManySql(
    (knex.schema.createTable(model.table, function(this: Knex.TableBuilder) {
      for (const columnName of Object.keys(model.columns)) {
        const columnType = model.columns[columnName];
        const col = this.specificType(columnName, sqliteColumnType(columnType));
        if (columnName === model.primaryKey) {
          col.primary();
        }
      }
    }) as RealSchemaBuilder).toSQL(),
  );
}

function sqliteColumnType(columnType: Column): string {
  switch (columnType) {
    case Column.Boolean:
      return "boolean";
    case Column.Integer:
      return "integer";
    case Column.JSON:
      return "text";
    case Column.Text:
      return "text";
    case Column.DateTime:
      return "timestamp without time zone";
    default:
      // we don't know how to check other types
      throw new Error(`Unsupported column type ${columnType}`);
  }
}
