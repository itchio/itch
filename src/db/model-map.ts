import Querier, { KnexCb } from "./querier";

import { Model, Column } from "./model";
import { IConnection } from ".";

import { IGame, GameModel } from "./models/game";
import { IExternalGame, ExternalGameModel } from "./models/external-game";
import { ICollection, CollectionModel } from "./models/collection";
import { IDownloadKey, DownloadKeyModel } from "./models/download-key";
import { ICave, CaveModel } from "./models/cave";
import { IUser, UserModel } from "./models/user";
import { IProfile, ProfileModel } from "./models/profile";
import { IGamePassword, GamePasswordModel } from "./models/game-password";
import { IGameSecret, GameSecretModel } from "./models/game-secret";

import { indexBy } from "underscore";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "model-map" });

export interface IModelMap {
  [key: string]: Model;
}

export const modelMap: IModelMap = {
  games: GameModel,
  externalGames: ExternalGameModel,
  collections: CollectionModel,
  downloadKeys: DownloadKeyModel,
  caves: CaveModel,
  users: UserModel,
  profiles: ProfileModel,
  gamePasswords: GamePasswordModel,
  gameSecrets: GameSecretModel,
};

interface IConditions {
  [key: string]: any;
}

class Repository<T> {
  constructor(private model: Model, private q: Querier) {}

  get(cb: KnexCb): T | null {
    return this.q.get(this.model, cb);
  }

  count(cb: KnexCb): number {
    return this.q.get(this.model, k => cb(k).count())["count(*)"];
  }

  all(cb: KnexCb): T[] {
    return this.q.all(this.model, cb);
  }

  run(cb: KnexCb): void {
    this.q.run(this.model, cb);
  }

  findOneById(id: any): T {
    return this.get(k => k.select().where({ [this.model.primaryKey]: id }));
  }

  findOne(conditions: IConditions): T {
    return this.get(k => k.select().where(conditions));
  }

  find(conditions: IConditions): T[] {
    return this.all(k => k.select().where(conditions));
  }
}

export class RepoContainer {
  games: Repository<IGame>;
  externalGames: Repository<IExternalGame>;
  collections: Repository<ICollection>;
  downloadKeys: Repository<IDownloadKey>;
  caves: Repository<ICave>;
  users: Repository<IUser>;
  profiles: Repository<IProfile>;
  gamePasswords: Repository<IGamePassword>;
  gameSecrets: Repository<IGameSecret>;

  protected q: Querier;
  protected conn: IConnection;

  /**
   * Create `Repository` instances for all models
   */
  setupRepos() {
    for (const key of Object.keys(modelMap)) {
      const Model = modelMap[key];
      this[key] = new Repository(Model, this.q);
    }
  }

  checkSchema() {
    for (const key of Object.keys(modelMap)) {
      const Model = modelMap[key];
      const dbColumns = this.conn
        .prepare(`PRAGMA table_info(${Model.table})`)
        .all();
      const byName = indexBy(dbColumns, "name");

      const { columns } = Model;
      for (const column of Object.keys(columns)) {
        const columnType = columns[column];
        const dbColumn = byName[column];
        if (!dbColumn) {
          logger.error(
            `DB schema error: missing column ${Model.table}/${column}`,
          );
          continue;
        }

        const dbType = dbColumn.type.toLowerCase();
        const assertType = (actual: string, expected: string[]) => {
          if (expected.indexOf(actual) === -1) {
            logger.error(
              `DB schema error: column ${Model.table}/${column} should have ` +
                `type ${expected.join(" or ")}, is ${dbType} instead`,
            );
          }
        };

        switch (columnType) {
          case Column.Boolean:
            assertType(dbType, ["boolean"]);
            break;
          case Column.Integer:
            assertType(dbType, ["integer"]);
            break;
          case Column.JSON:
            assertType(dbType, ["text", "json"]);
            break;
          case Column.Text:
            assertType(dbType, ["text"]);
            break;
          case Column.DateTime:
            assertType(dbType, ["timestamp without time zone", "datetime"]);
          default:
          // we don't know how to check other types
        }
      }
    }
  }

  /**
   * Check that the DB schema matches our expectations.
   * If tables or columns are missing
   */
}
