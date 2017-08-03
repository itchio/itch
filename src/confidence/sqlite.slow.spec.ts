import suite from "../test-suite";
import * as Database from "better-sqlite3";
import * as hades from "../db/hades";

import Querier from "../db/querier";
import * as squel from "squel";
import { Column, Model } from "../db/model";
import { toJSONField } from "../db/json-field";

import * as _ from "underscore";

const Game: Model = {
  table: "games",
  primaryKey: "id",
  columns: {
    id: Column.Integer,
    title: Column.Text,
    shortDesc: Column.Text,
  },
};

const Jason: Model = {
  table: "jasons",
  primaryKey: "identifier",
  columns: {
    identifier: Column.Text,
    timestamp: Column.DateTime,
    object: Column.JSON,
  },
};

const Noel: Model = {
  table: "noels",
  primaryKey: "id",
  columns: {
    happy: Column.Boolean,
  },
};

suite(__filename, s => {
  s.case("run a few queries", t => {
    const conn = new Database("sqlite_test.db", {
      memory: true,
    });

    const q = new Querier(conn);

    conn.exec(`
DROP TABLE IF EXISTS games;

CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  title TEXT,
  shortDesc TEXT
);

DROP TABLE IF EXISTS jasons;

CREATE TABLE jasons (
  identifier TEXT PRIMARY KEY,
  timestamp DATETIME,
  object JSON
);

DROP TABLE IF EXISTS noels;

CREATE TABLE noels (
  id INTEGER PRIMARY KEY,
  happy BOOLEAN
);
    `);

    const gameData = [
      { id: 1, title: "Overland", shortDesc: "Everything is on fire" },
      { id: 2, title: "Puzzle Puppers", shortDesc: "Drag out doggos!" },
      { id: 3, title: "Thorny Weather", shortDesc: "Underrated puzzle game" },
      { id: 4, title: "Aven Colony", shortDesc: "It's a huge colony" },
      { id: 5, title: "Not A Puzzle" },
      { id: 6, shortDesc: "No title because hey" },
      { id: 7 },
    ];

    q.withTransaction(() => {
      for (const data of gameData) {
        q.insert(Game, k => k.setFields(hades.insertFor(data, Game)));
      }
    });

    let allGames = q.all(Game);
    t.is(allGames.length, gameData.length);

    let fetchedGame = q.get(Game, k => k.where("id = ?", 1));
    t.ok(fetchedGame);

    t.same(fetchedGame.title, "Overland");
    t.same(fetchedGame.shortDesc, "Everything is on fire");

    const updateGame = {
      id: 1,
      shortDesc: "Good luck",
    };
    const diff = hades.updateFor(fetchedGame, updateGame, Game);
    t.same(diff, {
      shortDesc: "Good luck",
    });

    q.update(Game, k => k.where("id = ?", updateGame.id).setFields(diff));

    fetchedGame = q.get(Game, k => k.where("id = ?", 1));
    t.ok(fetchedGame);
    t.same(fetchedGame.title, "Overland", "title is still the same");
    t.same(fetchedGame.shortDesc, "Good luck", "desc was updated");

    fetchedGame = q.get(Game, k => k.where("title = ?", "Puzzle Puppers"));
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 2);

    const searchGame = (query: string) =>
      q.get(Game, k => k.where("LOWER(title) LIKE LOWER(?)", `%${query}%`));

    fetchedGame = searchGame("puzzle");
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 2);

    fetchedGame = searchGame("COLONY");
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 4);

    const puzzleQuery = (k: squel.Select, offset: number, limit: number) => {
      const arg = `%puzzle%`;
      return k
        .where(
          squel
            .expr()
            .or("LOWER(title) LIKE LOWER(?)", arg)
            .or("LOWER(shortDesc) LIKE LOWER(?)", arg),
        )
        .offset(offset)
        .limit(limit);
    };

    let puzzleGames = q.all(Game, k => puzzleQuery(k, 0, 1));
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 1, "fetches first page");

    puzzleGames = q.all(Game, k => puzzleQuery(k, 1, 1));
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 1, "fetches second page");

    puzzleGames = q.all(Game, k => puzzleQuery(k, 2, 1));
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 1, "fetches third page");

    puzzleGames = q.all(Game, k => puzzleQuery(k, 3, 1));
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 0, "fourth page is empty");

    let puzzleGamesCount;
    [puzzleGames, puzzleGamesCount] = [
      q.all(Game, k => puzzleQuery(k, 0, 2)),
      q.get(Game, k => puzzleQuery(k, 0, 2).field("count(*)"))["count(*)"],
    ];
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 2, "finds two games");
    t.same(puzzleGamesCount, 3, "counts three games");

    let specificGames = q.all(Game, k => k.where("id in ?", [2, 4, 12]));
    t.ok(specificGames);
    t.same(specificGames.length, 2, "found both games by id");
    t.ok(_.find(specificGames, { id: 2 }));
    t.ok(_.find(specificGames, { id: 4 }));
    t.notOk(_.find(specificGames, { id: 6 }));

    {
      const game1 = q.get(Game, k => k.where("id = ?", 1));
      q.delete(Game, k => k.where("id = ?", 1));
      const game2 = q.get(Game, k => k.where("id = ?", 1));
      t.ok(game1);
      t.notOk(game2);
    }

    const object = {
      hello: "world",
    };
    const timestamp = new Date("2011-01-20T19:00:00Z");
    const jason = {
      identifier: "1209d-afa-0g9-0na-9sdf09",
      object: toJSONField(object),
      timestamp,
    };

    q.insert(Jason, k => k.setFields(hades.insertFor(jason, Jason)));

    let newJason: any = {
      ...jason,
      object: {
        hello: "world",
      },
      timestamp,
    };

    const fetchedJason = q.get(Jason, k =>
      k.where("identifier = ?", jason.identifier),
    );
    let up = hades.updateFor(fetchedJason, newJason, Jason);
    t.same(up, null);

    newJason = {
      identifier: jason.identifier,
      object: {
        hello: "dummy",
      },
    };
    up = hades.updateFor(fetchedJason, newJason, Jason);
    t.same(up, { object: JSON.stringify(newJason.object) });

    newJason = {
      identifier: jason.identifier,
      timestamp: new Date("2017-01-20T19:00:00Z"),
    };
    up = hades.updateFor(fetchedJason, newJason, Jason);
    t.same(up, { timestamp: "2017-01-20 19:00:00" });

    const noel = {
      id: 1,
      happy: true,
    };
    q.insert(Noel, k => k.setFields(hades.insertFor(noel, Noel)));

    const fetchedNoel = q.get(Noel, k => k.where("id = ?", 1));
    t.same(fetchedNoel, {
      id: 1,
      happy: 1,
    });
  });
});
