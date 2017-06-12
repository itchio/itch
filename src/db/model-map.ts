
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
  "games": Game,
  "externalGames": ExternalGame,
  "collections": Collection,
  "downloadKeys": DownloadKey,
  "caves": Cave,
  "users": User,
  "profiles": Profile,
  "gamePasswords": GamePassword,
  "gameSecrets": GameSecret,
};
