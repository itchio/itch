import Querier, { SelectCb, DeleteCb, UpdateCb } from "./querier";
import * as squel from "squel";

import { Model } from "./model";

import { GameModel } from "./models/game";
import { IExternalGame, ExternalGameModel } from "./models/external-game";
import { ICollection, CollectionModel } from "./models/collection";
import { IDownloadKey, DownloadKeyModel } from "./models/download-key";
import { ICave, CaveModel } from "./models/cave";
import { UserModel } from "./models/user";
import { IProfile, ProfileModel } from "./models/profile";
import { IGamePassword, GamePasswordModel } from "./models/game-password";
import { IGameSecret, GameSecretModel } from "./models/game-secret";
import { Game, User } from "node-buse/lib/messages";
import { IDownloadItem } from "../types/index";
import { DownloadModel } from "./models/download";

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
  downloads: DownloadModel,
};

interface IConditions {
  [key: string]: any;
}

function doWhere(k: squel.Select, conditions: IConditions): squel.Select {
  const keys = Object.keys(conditions);
  const string = keys.map(k => `${k} = ?`).join(" AND ");
  const values = keys.map(k => conditions[k]);
  return k.where(string, ...values);
}

class Repository<T> {
  constructor(private model: Model, private q: Querier) {}

  get(cb: SelectCb): T | null {
    return this.q.get(this.model, cb);
  }

  count(cb: SelectCb): number {
    return this.q.get(this.model, k => cb(k).field("count(*)"))["count(*)"];
  }

  all(cb: SelectCb): T[] {
    return this.q.all(this.model, cb);
  }

  allByKeySafe(primaryKeys: any[]): T[] {
    return this.q.allByKeySafe(this.model, primaryKeys);
  }

  delete(cb: DeleteCb): void {
    return this.q.delete(this.model, cb);
  }

  update(cb: UpdateCb): void {
    return this.q.update(this.model, cb);
  }

  findOneById(id: any): T {
    return this.get(k => k.where(`${this.model.primaryKey} = ?`, id));
  }

  findOne(conditions: IConditions): T {
    return this.get(k => doWhere(k, conditions));
  }

  find(conditions: IConditions): T[] {
    return this.all(k => doWhere(k, conditions));
  }
}

export class RepoContainer {
  games: Repository<Game>;
  externalGames: Repository<IExternalGame>;
  collections: Repository<ICollection>;
  downloadKeys: Repository<IDownloadKey>;
  caves: Repository<ICave>;
  users: Repository<User>;
  profiles: Repository<IProfile>;
  gamePasswords: Repository<IGamePassword>;
  gameSecrets: Repository<IGameSecret>;
  downloads: Repository<IDownloadItem>;

  protected q: Querier;

  /**
   * Create `Repository` instances for all models
   */
  setupRepos() {
    for (const key of Object.keys(modelMap)) {
      const Model = modelMap[key];
      this[key] = new Repository(Model, this.q);
    }
  }
}
