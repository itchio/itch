
import Game from "../db/models/game";

import {
  IOwnUserRecord,
  IUploadRecord,
  IUpgradePathItem,
  IOwnGameRecord,
  IGameRecord,
  IUserRecord,
  IDownloadKey,
  ICollectionRecord,
  IBuildRecord,
} from ".";

/** In API responses, the user object is nested - we normalize it later */
export interface IAPIGame extends Game {
  user: IUserRecord;
}

export interface IAPIKey {
  /** identifier of key */
  id: number;

  /** identifier of user to which key belongs */
  userId: number;

  /** actual API key value */
  key: string;

  /** timestamp when the API key was created */
  createdAt: string;

  /** timestamp when the API key was last updated */
  updatedAt: string;

  /** version of the app used to obtain API key */
  sourceVersion?: string;
}

export interface IMeResult {
  /** extended user info, see IOwnUserRecord */
  user: IOwnUserRecord;
}

export type ILoginKeyResult = IMeResult;

export interface ILoginWithPasswordResult {
  /** itch.io API key (fresh or cached) */
  key?: IAPIKey;

  /** cookie for automatic web log-in */
  cookie?: {
    [name: string]: string;
  };
  
  /** set if we tried to log in without totp code */
  totpNeeded?: boolean;
}

export interface IUpgradeResponse {
  /** each item represents one patch needed to upgrade to the latest version */
  upgradePath: IUpgradePathItem[];
}

export interface IListUploadsResponse {
  uploads: IUploadRecord[];
}

export interface IMyGamesResult {
  games: IOwnGameRecord[];
}

export interface IOwnDownloadKey extends IDownloadKey {
  game: IAPIGame;
}

export interface IMyOwnedKeysResult {
  ownedKeys: IOwnDownloadKey[];
}

export interface IGameResult {
  game: IAPIGame;
}

export type BuildFileType = "archive" | "patch" | "manifest" | "signature";

export interface ICollectionResult {
  collection: ICollectionRecord;
}

export interface IMyCollectionsResult {
  collections: ICollectionRecord[];
}

export interface IUserResult {
  user: IUserRecord;
}

export interface ICollectionGamesResult {
  /** total number of games in collection, across all pages */
  totalItems: number;

  /** current page index */
  page: number;

  /** number of items listed on each page */
  perPage: number;

  /** games on current page */
  games: IGameRecord[];
}

export interface ISearchGamesResult {
  /** total number of games in search results, across all pages */
  totalItems: number;

  /** current page index */
  page: number;

  /** number of items listed on each page */
  perPage: number;

  /** games on current page */
  games: IAPIGame[];
}

export interface ISearchUsersResult {
  /** total number of users in search results, across all pages */
  totalItems: number;

  /** current page index */
  page: number;

  /** number of items listed on each page */
  perPage: number;

  /** users on current page */
  users: IUserRecord[];
}

export interface IDownloadUploadResult {
  /** expiring URL to download given upload */
  url: string;
}

export interface IListBuildsResponse {
  builds: IBuildRecord[];
}

export interface IBuildResponse {
  build: IBuildRecord;
}

export type IDownloadBuildResult = IDownloadUploadResult;

export interface IPasswordOrSecret {
  password?: string;
  secret?: string;
}

export interface IDownloadBuildFileExtras extends IPasswordOrSecret {
  prefer_optimized?: number;
}

export interface IGameExtras extends IPasswordOrSecret {}

export interface IListUploadsExtras extends IPasswordOrSecret {}
