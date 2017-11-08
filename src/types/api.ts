import { IGame, IOwnGame } from "../db/models/game";
import { IUser, IOwnUser } from "../db/models/user";
import { IDownloadKey } from "../db/models/download-key";
import { ICollection } from "../db/models/collection";

import { IUpload, IUpgradePathItem, IBuild } from ".";

/** In API responses, the user object is nested - we normalize it later */
export interface IAPIGame extends IGame {
  user: IUser;
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
  /** extended user info */
  user: IOwnUser;
}

export type ILoginKeyResult = IMeResult;

export interface ILoginExtras {
  recaptchaResponse?: string;
}

export interface ISuccessfulLoginResult {
  /** itch.io API key (fresh or cached) */
  key?: IAPIKey;

  /** cookie for automatic web log-in */
  cookie?: {
    [name: string]: string;
  };
}

export interface ILoginWithPasswordResult extends ISuccessfulLoginResult {
  /** set if we need to fill in a recaptcha before logging in */
  recaptchaNeeded?: boolean;

  /** if recaptchaNeeded is true, this is set to an URL that'll serve a recaptcha */
  recaptchaUrl?: string;

  /** set if we tried to log in without totp code */
  totpNeeded?: boolean;

  /** token used for verify step (login v3) */
  token?: string;
}

export interface ITotpVerifyResult extends ISuccessfulLoginResult {
  // nothing more
}

export interface IUpgradeResponse {
  /** each item represents one patch needed to upgrade to the latest version */
  upgradePath: IUpgradePathItem[];
}

export interface IListUploadsResponse {
  uploads: IUpload[];
}

export interface IMyGamesResult {
  games: IOwnGame[];
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
  collection: ICollection;
}

export interface IMyCollectionsResult {
  collections: ICollection[];
}

export interface IUserResult {
  user: IUser;
}

export interface ICollectionGamesResult {
  /** total number of games in collection, across all pages */
  totalItems: number;

  /** current page index */
  page: number;

  /** number of items listed on each page */
  perPage: number;

  /** games on current page */
  games: IGame[];
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
  users: IUser[];
}

export interface IDownloadUploadResult {
  /** expiring URL to download given upload */
  url: string;
}

export interface IListBuildsResponse {
  builds: IBuild[];
}

export interface IBuildResponse {
  build: IBuild;
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
