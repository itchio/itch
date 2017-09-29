import { Model, Column } from "./model";

import suite, { TestWatcher, registerDBToClose } from "../test-suite";
import { fromJSONField } from "./json-field";
import { DB } from "./db";
import { migrateDatabase } from "./index";
import { IMigrations, listDbColumns } from "./migrator";
import { fromDateTimeField, toDateTimeField } from "./datetime-field";
import { findWhere } from "underscore";

const Cell: Model = {
  table: "cells",
  primaryKey: "id",
  columns: {
    id: Column.Integer,
    timestamp: Column.DateTime,
    object: Column.JSON,
    note: Column.Text,
    extra: Column.Integer,
  },
};

const modelMap = {
  cells: Cell,
};

const migrations: IMigrations = {};

suite(__filename, s => {
  const watcher = new TestWatcher();
  const db = new DB(modelMap);
  db.load(watcher.store, ":memory:");
  registerDBToClose(db);
  const q = db.getQuerier();
  const date1 = new Date("1969-05-03T04:35Z");
  const date2 = new Date("2003-07-21T10:21Z");

  const assertColumnType = (
    t: Zopf.ITest,
    columnName: string,
    columnType: string
  ) => {
    const dbColumns = listDbColumns(db.getQuerier(), "cells");
    const noteType = findWhere(dbColumns, { name: columnName });
    t.same(noteType.type, columnType);
  };

  const migrate = async () => {
    await migrateDatabase(db, migrations);
  };

  s.case("first migrate should create table", async t => {
    await migrate();

    assertColumnType(t, "id", "integer");
    assertColumnType(t, "note", "text");
    assertColumnType(t, "object", "text");
    assertColumnType(t, "timestamp", "timestamp without time zone");
    assertColumnType(t, "extra", "integer");

    db.saveMany({
      cells: {
        1: {
          timestamp: date1,
          object: { a: "b" },
          note: "hi",
        },
        2: {
          timestamp: date2,
          object: { c: "d" },
          note: "bye",
        },
      },
    });

    {
      let c = q.get(Cell, k => k.where("id = ?", 1));
      t.same(c.note, "hi");
      t.same(fromDateTimeField(c.timestamp), date1);
      t.same(fromJSONField(c.object), { a: "b" });
    }
  });

  s.case(
    "marking column as deprecated should not remove it from db",
    async t => {
      Cell.deprecatedColumns = {};
      Cell.deprecatedColumns.timestamp = Cell.columns.timestamp;
      delete Cell.columns.timestamp;
      await migrate();

      {
        let c = q.get(Cell, k => k.where("id = ?", 1));
        t.same(c.note, "hi");
        t.same(fromDateTimeField(c.timestamp), date1);
        t.same(fromJSONField(c.object), { a: "b" });
      }
    }
  );

  s.case(
    "changing column type and running unrelated migration should preserve columns from db",
    async t => {
      Cell.columns.extra = Column.JSON;

      assertColumnType(t, "extra", "integer");

      migrations[1506691176] = async m => {
        const { db } = m;

        db.saveOne("cells", 1, {
          note: "well hello",
        });
      };
      await migrate();

      assertColumnType(t, "extra", "text");

      {
        let c = q.get(Cell, k => k.where("id = ?", 1));
        t.same(c.note, "well hello");
        t.same(fromDateTimeField(c.timestamp), date1);
        t.same(fromJSONField(c.object), { a: "b" });
      }
    }
  );

  s.case("migration should be able to drop columns", async t => {
    migrations[1506694176] = async m => {
      const { db } = m;
      const q = db.getQuerier();

      const toSave = {
        cells: {},
      };
      const cells = q.all(Cell);
      for (const cell of cells) {
        toSave.cells[cell.id] = {
          object: {
            ...fromJSONField(cell.object, {}),
            timestamp: toDateTimeField(cell.timestamp),
          },
        };
      }

      db.saveMany(toSave);
      m.dropColumns(Cell, ["timestamp"]);
    };
    await migrate();

    {
      let c = q.get(Cell, k => k.where("id = ?", 1));
      t.false(c.hasOwnProperty("timestamp"));
      t.same(c.note, "well hello");
      t.same(fromJSONField(c.object), {
        a: "b",
        timestamp: toDateTimeField(date1),
      });
    }

    {
      let c = q.get(Cell, k => k.where("id = ?", 2));
      t.false(c.hasOwnProperty("timestamp"));
      t.same(c.note, "bye");
      t.same(fromJSONField(c.object), {
        c: "d",
        timestamp: toDateTimeField(date2),
      });
    }
  });
});
