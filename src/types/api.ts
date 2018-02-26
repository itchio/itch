import { Game, User, Build, Upload } from "../buse/messages";

import {
  IUpgradePathItem,
  IUserSet,
  IDownloadKeySet,
  IGameSet,
  ICollectionSet,
} from ".";

export interface IOwnGameSet {
  [id: string]: Game;
}

/** In API responses, the user object is nested - we normalize it later */
export interface IAPIGame extends Game {
  user: User;
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
  user: User;
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
  uploads: Upload[];
}

export interface IMyGamesResult {
  result: {
    gameIds: number[];
  };
  entities: {
    games: IOwnGameSet;
    users: IUserSet;
  };
}

export interface IMyOwnedKeysResult {
  result: {
    downloadKeyIds: number[];
  };
  entities: {
    downloadKeys: IDownloadKeySet;
    games: IGameSet;
    users: IUserSet;
  };
}

export interface IGameResult {
  result: {
    gameId: number;
  };
  entities: {
    games: IGameSet;
    users: IUserSet;
  };
}

export interface ICollectionResult {
  result: {
    collectionId: number;
  };
  entities: {
    collections: ICollectionSet;
  };
}

export interface IMyCollectionsResult {
  result: {
    collectionIds: number[];
  };

  entities: {
    collections: ICollectionSet;
    games: IGameSet;
    users: IUserSet;
  };
}

export interface IUserResult {
  result: {
    userId: number;
  };

  entities: {
    users: IUserSet;
  };
}

export interface ICollectionGamesResult {
  result: {
    /** current page index */
    page: number;

    /** number of items listed on each page */
    perPage: number;

    /** list of game IDs on this page, in API order */
    gameIds: number[];
  };

  // Note: as of 2017-03-11, this endpoint does
  // not include users or sales in the game objects
  entities: {
    /** games on current page */
    games: IGameSet;
  };
}

export interface ISearchGamesResult {
  result: {
    /** current page index */
    page: number;

    /** number of items listed on each page */
    perPage: number;

    /** game IDs on this page in API order */
    gameIds: number[];
  };

  // Note: as of 2017-03-11, no users are returned in games search
  entities: {
    /** games on current page */
    games: IGameSet;
  };
}

export interface ISearchUsersResult {
  result: {
    /** current page index */
    page: number;

    /** number of items listed on each page */
    perPage: number;

    /** user IDs on this page in API order */
    userIds: number[];
  };

  entities: {
    /** users on current page */
    users: IUserSet;
  };
}

export interface IDownloadUploadResult {
  /** expiring URL to download given upload */
  url: string;
}

export interface IListBuildsResponse {
  builds: Build[];
}

export interface IBuildResponse {
  build: Build;
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
