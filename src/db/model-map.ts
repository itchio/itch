import { Connection, Repository } from "typeorm";

import Game from "./models/game";
import ExternalGame from "./models/external-game";
import Collection from "./models/collection";
import DownloadKey from "./models/download-key";
import Cave from "./models/cave";
import User from "./models/user";
import Profile from "./models/profile";
import GamePassword from "./models/game-password";
import GameSecret from "./models/game-secret";

export interface IModelMap {
  [key: string]: Function;
}

export const modelMap: IModelMap = {
  games: Game,
  externalGames: ExternalGame,
  collections: Collection,
  downloadKeys: DownloadKey,
  caves: Cave,
  users: User,
  profiles: Profile,
  gamePasswords: GamePassword,
  gameSecrets: GameSecret,
};

export const modelList = Object.keys(modelMap).map(k => modelMap[k]);

export class RepoContainer {
  conn: Connection;

  games: Repository<Game>;
  externalGames: Repository<ExternalGame>;
  collections: Repository<Collection>;
  downloadKeys: Repository<DownloadKey>;
  caves: Repository<Cave>;
  users: Repository<User>;
  profiles: Repository<Profile>;
  gamePasswords: Repository<GamePassword>;
  gameSecrets: Repository<GameSecret>;

  setupRepos() {
    for (const key of Object.keys(modelMap)) {
      const Model = modelMap[key];
      this[key] = this.conn.getRepository(Model);
    }
  }
}
