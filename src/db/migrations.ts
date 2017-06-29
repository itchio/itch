import * as Knex from "knex";

import { Model } from "./model";
import { knex } from "./querier";
import { DB } from ".";

import { sortBy, indexBy } from "underscore";

import { toDateTimeField } from "./datetime-field";

import { GameModel, IOwnGame } from "./models/game";
import { UserModel, IOwnUser } from "./models/user";
import { CollectionModel, ICollection } from "./models/collection";
import { CaveModel, ICave } from "./models/cave";
import { DownloadKeyModel, IDownloadKey } from "./models/download-key";
import { GamePasswordModel, IGamePassword } from "./models/game-password";
import { GameSecretModel, IGameSecret } from "./models/game-secret";
import { ExternalGameModel, IExternalGame } from "./models/external-game";

interface IMigrator {
  db: DB;
  createTable: <T>(model: Model, cb: (t: ITableBuilder<T>) => void) => void;
}

interface IMigration {
  (m: IMigrator): void;
}

interface IMigrations {
  [key: number]: IMigration;
}

interface ITableBuilder<T> {
  integer(name: keyof T): Knex.ColumnBuilder;
  text(name: keyof T): Knex.ColumnBuilder;
  json(name: keyof T): Knex.ColumnBuilder;
  boolean(name: keyof T): Knex.ColumnBuilder;
  dateTime(name: keyof T): Knex.ColumnBuilder;
}

// stolen from lapis, yay
const migrations: IMigrations = {
  1498742676: async m => {
    m.createTable<IOwnGame>(GameModel, t => {
      t.integer("id").primary();

      t.text("url");
      t.text("userId");
      t.text("title");

      t.text("shortText");
      t.text("stillCoverUrl");
      t.text("coverUrl");
      t.text("type");
      t.text("classification");
      t.json("embed");

      t.boolean("hasDemo");
      t.integer("minPrice");
      t.json("sale");
      t.text("currency");
      t.boolean("inPressSystem");
      t.boolean("canBeBought");

      t.dateTime("createdAt");
      t.dateTime("publishedAt");

      t.boolean("pOsx");
      t.boolean("pWindows");
      t.boolean("pLinux");
      t.boolean("pAndroid");

      t.integer("downloadsCount");
      t.integer("purchasesCount");
      t.integer("viewsCount");
    });

    m.createTable<IOwnUser>(UserModel, t => {
      t.integer("id").primary();
      t.text("username");
      t.text("displayName");
      t.text("url");
      t.text("coverUrl");
      t.text("stillCoverUrl");
    });

    m.createTable<ICollection>(CollectionModel, t => {
      t.integer("id").primary();
      t.text("title");
      t.integer("userId");

      t.dateTime("createdAt");
      t.dateTime("updatedAt");

      t.integer("gamesCount");
      t.json("gameIds");
    });

    m.createTable<ICave>(CaveModel, t => {
      t.text("id").primary();
      t.integer("gameId");
      t.integer("externalGameId");

      t.json("upload");
      t.integer("buildId");
      t.text("buildUserVersion");
      t.text("channelName");

      t.dateTime("installedAt");
      t.dateTime("lastTouchedAt");

      t.integer("secondsRun");
      t.boolean("handPicked");
      t.integer("installedSize");
      t.boolean("installedUE4Prereq");
      t.json("installedPrereqs");

      t.text("installLocation");
      t.text("installFolder");
      t.integer("pathScheme");

      t.json("verdict");
    });

    m.createTable<IDownloadKey>(DownloadKeyModel, t => {
      t.integer("id").primary();

      t.integer("gameId");
      t.dateTime("createdAt");
      t.dateTime("updatedAt");
      t.integer("ownerId");
    });

    m.createTable<IGamePassword>(GamePasswordModel, t => {
      t.integer("id").primary();
      t.text("password");
    });

    m.createTable<IGameSecret>(GameSecretModel, t => {
      t.integer("id").primary();
      t.text("secret");
    });

    m.createTable<IExternalGame>(ExternalGameModel, t => {
      t.text("id").primary();

      t.text("title");
      t.text("shortText");
      t.text("coverUrl");
    });
  },
};

// Knex typings forgot about this lil' important part
type RealSchemaBuilder = Knex.SchemaBuilder & {
  toSQL(): Knex.Sql[];
};

const migrationsTable = "__itch_migrations";
export async function runMigrations(db: DB) {
  let run = (sql: Knex.Sql) => {
    db.prepare(sql.sql).run(...sql.bindings);
  };

  let runAll = (sqls: Knex.Sql[]) => {
    for (const sql of sqls) {
      run(sql);
    }
  };

  let all = (sql: Knex.Sql): any[] => {
    return db.prepare(sql.sql).all(...sql.bindings);
  };

  runAll(
    (knex.schema.createTableIfNotExists(migrationsTable, function(
      this: Knex.TableBuilder,
    ) {
      this.integer("id");
      this.dateTime("migratedAt");
    }) as RealSchemaBuilder).toSQL(),
  );

  const doneMigrations = all(knex(migrationsTable).select().toSQL());
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

  if (todo.length === 0) {
    return;
  }

  const migrator: IMigrator = {
    createTable: (model: Model, cb) => {
      runAll(
        (knex.schema.createTable(model.table, function(this) {
          cb(this);
        }) as RealSchemaBuilder).toSQL(),
      );
    },
    db,
  };

  for (const id of todo) {
    db.prepare("BEGIN").run();
    try {
      const migration = migrations[id];
      await migration(migrator);
      run(
        knex(migrationsTable)
          .insert({
            id,
            migratedAt: toDateTimeField(new Date()),
          })
          .toSQL(),
      );
      db.prepare("COMMIT").run();
    } catch (e) {
      db.prepare("ROLLBACK").run();
      throw e;
    }
  }
}
