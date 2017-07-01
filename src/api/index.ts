import * as querystring from "querystring";

import { request, RequestFunc } from "../net";
import { camelifyObject } from "../format";
import urls from "../constants/urls";

import mkcooldown from "./cooldown";

import { contains } from "underscore";

import { IDownloadKey } from "../db/models/download-key";
import {
  ILoginKeyResult,
  IUpgradeResponse,
  IListUploadsResponse,
  ILoginWithPasswordResult,
  IMeResult,
  IMyGamesResult,
  IMyOwnedKeysResult,
  IMyCollectionsResult,
  IGameResult,
  IUserResult,
  ICollectionResult,
  ICollectionGamesResult,
  ISearchGamesResult,
  ISearchUsersResult,
  IDownloadUploadResult,
  IListBuildsResponse,
  IBuildResponse,
  BuildFileType,
  IDownloadBuildResult,
  IGameExtras,
  IListUploadsExtras,
  IPasswordOrSecret,
  IDownloadBuildFileExtras,
} from "../types/api";

const DUMP_API_CALLS = process.env.LET_ME_IN === "1";
import { makeLogger, devNull } from "../logger";
const logger = DUMP_API_CALLS ? makeLogger() : devNull;

type HTTPMethod = "get" | "head" | "post";

interface ITransformerMap {
  [key: string]: (input: any) => any;
}

// ugh
interface IAPIRequestOpts {
  keepSnakeCase?: boolean;
  transformers?: ITransformerMap;
}

/**
 * async Wrapper for the itch.io API
 */
export class Client {
  /** base URL for API requests */
  rootUrl: string;

  /** timestamp of last request */
  lastRequest: number;

  /** http request maker */
  requestFunc: RequestFunc;

  cooldown = mkcooldown(130);

  constructor() {
    this.rootUrl = `${urls.itchioApi}/api/1`;
    this.lastRequest = 0;
    this.requestFunc = request;
  }

  /**
   * Make a `method` http request to `path`, passing `data` as parameters (GET, POST body, etc.)
   * `transformers` contain functions that change the result. Before transformers are run
   * the response is camelified.
   */
  async request(
    method: HTTPMethod,
    path: string,
    data: any = {},
    requestOpts: IAPIRequestOpts = {},
  ): Promise<any> {
    const t1 = Date.now();

    const uri = `${this.rootUrl}${path}`;

    await this.cooldown();
    const t2 = Date.now();

    const resp = await this.requestFunc(method, uri, data, {});
    let body = resp.body;
    const t3 = Date.now();

    const shortPath = path.replace(/^\/[^\/]*\//, "");
    logger.info(
      `${t2 - t1}ms wait, ${t3 -
        t2}ms http, ${method} ${shortPath} with ${JSON.stringify(data)}`,
    );

    if (resp.statusCode !== 200) {
      throw new Error(`HTTP ${resp.statusCode} ${path}`);
    }

    if (body.errors) {
      throw new ApiError(body.errors);
    }

    if (!requestOpts.keepSnakeCase) {
      body = camelifyObject(body);
    }

    if (requestOpts.transformers) {
      for (const key in requestOpts.transformers) {
        if (!requestOpts.transformers.hasOwnProperty(key)) {
          continue;
        }
        body[key] = requestOpts.transformers[key](body[key]);
      }
    }

    return body;
  }

  /**
   * Log in using an API key
   */
  async loginKey(key: string): Promise<ILoginKeyResult> {
    return await this.request("get", `/${key}/me`, {
      source: "desktop",
    });
  }

  async loginWithPassword(
    username: string,
    password: string,
    totpCode?: string,
  ): Promise<ILoginWithPasswordResult> {
    let data: {
      username: string;
      password: string;
      source: "desktop";
      totp_code?: string;
      v: number;
    } = {
      username: username,
      password: password,
      source: "desktop",
      v: 2,
    };
    if (totpCode) {
      data = {
        ...data,
        totp_code: totpCode,
      };
    }

    return await this.request("post", "/login", data);
  }

  withKey(key: string): AuthenticatedClient {
    return new AuthenticatedClient(this, key);
  }

  hasAPIError(errorObject: ApiError, apiError: string): boolean {
    return contains(errorObject.errors || [], apiError);
  }
}

export const client = new Client();
export default client;

/**
 * A user, according to the itch.io API
 */
export class AuthenticatedClient {
  client: Client;
  key: string;

  /**
   * Create a new authenticated client from a regular client and an API key
   */
  constructor(pClient: Client, key: string) {
    this.client = pClient;
    this.key = key;
  }

  /**
   * Craft an itchfs url suitable for usage with butler
   */
  itchfsURL(path: string, data: any = {}) {
    const queryParams = {
      api_key: this.key,
      ...data,
    };
    return `itchfs://${path}?${querystring.stringify(queryParams)}`;
  }

  /**
   * Make an authenticated request to the itch.io server
   */
  async request(
    method: HTTPMethod,
    path: string,
    data: any = {},
    requestOpts: IAPIRequestOpts = {},
  ): Promise<any> {
    const url = `/${this.key}${path}`;
    return await this.client.request(method, url, data, requestOpts);
  }

  /**
   * Retrieve games ones create or is a game admin for.
   */
  async myGames(data: any = {}): Promise<IMyGamesResult> {
    // TODO: paging, for the prolific game dev.
    return await this.request("get", "/my-games", data, {
      keepSnakeCase: true,
      transformers: { games: ensureArray },
    });
  }

  /**
   * Retrieve download keys linked to this account
   */
  async myOwnedKeys(data = {}): Promise<IMyOwnedKeysResult> {
    return await this.request("get", "/my-owned-keys", data, {
      keepSnakeCase: true,
      transformers: { owned_keys: ensureArray },
    });
  }

  /**
   * Retrieve extended user info for user associated with API key
   */
  async me(): Promise<IMeResult> {
    return await this.request("get", "/me");
  }

  async myCollections(): Promise<IMyCollectionsResult> {
    return await this.request(
      "get",
      "/my-collections",
      {},
      {
        keepSnakeCase: true,
        transformers: { collections: ensureArray },
      },
    );
  }

  async game(
    gameID: number,
    gameExtras: IGameExtras = {},
  ): Promise<IGameResult> {
    return await this.request("get", `/game/${gameID}`, gameExtras);
  }

  async user(userID: number): Promise<IUserResult> {
    return await this.request("get", `/users/${userID}`);
  }

  async collection(collectionID: number): Promise<ICollectionResult> {
    return await this.request("get", `/collection/${collectionID}`);
  }

  async collectionGames(
    collectionID: number,
    page = 1,
  ): Promise<ICollectionGamesResult> {
    return await this.request("get", `/collection/${collectionID}/games`, {
      page,
    });
  }

  async searchGames(query: string): Promise<ISearchGamesResult> {
    return await this.request(
      "get",
      "/search/games",
      { query },
      {
        keepSnakeCase: true,
        transformers: { games: ensureArray },
      },
    );
  }

  async searchUsers(query: string): Promise<ISearchUsersResult> {
    return await this.request(
      "get",
      "/search/users",
      { query },
      {
        keepSnakeCase: true,
        transformers: { users: ensureArray },
      },
    );
  }

  // list uploads

  async listUploads(
    downloadKey: IDownloadKey,
    gameID: number,
    extras: IListUploadsExtras = {},
  ): Promise<IListUploadsResponse> {
    // TODO: adjust API to support download_key_id
    if (downloadKey) {
      return await this.request(
        "get",
        `/download-key/${downloadKey.id}/uploads`,
        extras,
        {
          transformers: { uploads: ensureArray },
        },
      );
    } else {
      return await this.request("get", `/game/${gameID}/uploads`, extras, {
        transformers: { uploads: ensureArray },
      });
    }
  }

  // download uploads

  async downloadUpload(
    downloadKey: IDownloadKey,
    uploadID: number,
  ): Promise<IDownloadUploadResult> {
    return await this.request(
      "get",
      `/upload/${uploadID}/download`,
      sprinkleDownloadKey(downloadKey, {}),
    );
  }

  downloadUploadURL(
    downloadKey: IDownloadKey,
    uploadID: number,
    extras: IPasswordOrSecret = {},
  ): string {
    return this.itchfsURL(
      `/upload/${uploadID}/download`,
      sprinkleDownloadKey(downloadKey, extras),
    );
  }

  // wharf-related endpoints

  /**
   * List the N most recent builds for a wharf-enabled upload
   */
  async listBuilds(
    downloadKey: IDownloadKey,
    uploadID: number,
  ): Promise<IListBuildsResponse> {
    return await this.request(
      "get",
      `/upload/${uploadID}/builds`,
      sprinkleDownloadKey(downloadKey, {}),
      {
        transformers: { builds: ensureArray },
      },
    );
  }

  /**
   * Get detailed info for the given build of a given upload
   */
  async build(
    downloadKey: IDownloadKey,
    uploadID: number,
    buildID: number,
  ): Promise<IBuildResponse> {
    return await this.request(
      "get",
      `/upload/${uploadID}/builds/${buildID}`,
      sprinkleDownloadKey(downloadKey, {}),
    );
  }

  /**
   * Return list of patches needed to upgrade to the latest build
   */
  async findUpgrade(
    downloadKey: IDownloadKey,
    uploadID: number,
    currentBuildID: number,
  ): Promise<IUpgradeResponse> {
    return await this.request(
      "get",
      `/upload/${uploadID}/upgrade/${currentBuildID}`,
      sprinkleDownloadKey(downloadKey, { v: 2 }),
    );
  }

  /**
   * Download a given build
   */
  async downloadBuild(
    downloadKey: IDownloadKey,
    uploadID: number,
    buildID: number,
  ): Promise<IDownloadBuildResult> {
    return await this.request(
      "get",
      `/upload/${uploadID}/download/builds/${buildID}`,
      sprinkleDownloadKey(downloadKey, { v: 2 }),
    );
  }

  /**
   * Returns the itchfs URL of a given build
   */
  downloadBuildURL(
    downloadKey: IDownloadKey,
    uploadID: number,
    buildID: number,
    fileType: BuildFileType,
    extras: IDownloadBuildFileExtras = {},
  ): string {
    const path = `/upload/${uploadID}/download/builds/${buildID}/${fileType}`;

    return this.itchfsURL(path, sprinkleDownloadKey(downloadKey, extras));
  }

  async subkey(gameID: number, scope: string) {
    return await this.request("post", "/credentials/subkey", {
      game_id: gameID,
      scope,
    });
  }
}

/**
 * if not an array, return the empty array, otherwise identity
 * cf. https://github.com/itchio/itchio-app/issues/48
 * this works around the fact that, in lua, empty object and empty array both
 * serialize to empty object
 */
export function ensureArray(v: any): any[] {
  if (!v || !v.length) {
    return [];
  }
  return v;
}

/**
 * if downloadKey isn't null, add its id to the parameters
 */
function sprinkleDownloadKey(
  downloadKey: IDownloadKey | null,
  params: any,
): any {
  if (!downloadKey) {
    return params;
  }

  return {
    ...params,
    download_key_id: downloadKey.id,
  };
}

/**
 * An set of errors returned by the itch.io API. Those aren't
 * localized, so string matching is an option.
 */
export class ApiError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super(errors.join(", "));
    this.errors = errors;
  }

  toString() {
    return `API Error: ${this.errors.join(", ")}`;
  }
}
