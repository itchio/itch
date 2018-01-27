import { Model, Column } from "./model";

import suite, { TestWatcher, withCustomDB } from "../test-suite";

const Cell: Model = {
  table: "cells",
  primaryKey: "id",
  columns: {
    id: Column.Integer,
    timestamp: Column.DateTime,
    object: Column.JSON,
    note: Column.Text,
    floating: Column.Float,
  },
};

const modelMap = {
  cells: Cell,
};

suite(__filename, s => {
  s.case("a few DB ops", async t => {
    const watcher = new TestWatcher();
    await withCustomDB(watcher.store, modelMap, async db => {
      const q = db.getQuerier();

      const allCells = {
        "1": {
          id: "1",
          note: "one",
        },
        "2": {
          id: "2",
          note: "two",
        },
        "3": {
          id: "3",
          note: "three",
        } as any,
      };

      db.saveMany({
        cells: allCells,
      });

      t.same(q.get(Cell, k => k.where("id = ?", 1)).note, "one");
      t.same(q.get(Cell, k => k.where("id = ?", 2)).note, "two");
      t.same(q.get(Cell, k => k.where("id = ?", 3)).note, "three");

      // nothing gets updated
      db.saveMany({
        cells: allCells,
      });

      t.same(q.get(Cell, k => k.where("id = ?", 1)).note, "one");
      t.same(q.get(Cell, k => k.where("id = ?", 2)).note, "two");
      t.same(q.get(Cell, k => k.where("id = ?", 3)).note, "three");

      // only one record gets updated

      allCells["3"].note = "tres";
      db.saveMany({
        cells: allCells,
      });

      t.same(q.get(Cell, k => k.where("id = ?", 3)).note, "tres");

      // record has keys set to the value undefind

      allCells["3"].timestamp = undefined;
      allCells["3"].object = undefined;
      db.saveMany({
        cells: allCells,
      });

      t.false(q.get(Cell, k => k.where("id = ?", 3)).timestamp);

      // setting a float

      allCells["3"].floating = 3.14;
      db.saveMany({
        cells: allCells,
      });

      t.same(q.get(Cell, k => k.where("id = ?", 3)).floating, 3.14);
    });
  });
});
