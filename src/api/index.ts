import * as querystring from "querystring";

import { request, RequestFunc } from "../net";
import { camelifyObject, fileSize } from "../format";
import urls from "../constants/urls";
import * as schemas from "./schemas";

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
  IDownloadBuildResult,
  IGameExtras,
  IListUploadsExtras,
  IPasswordOrSecret,
  IDownloadBuildFileExtras,
  ILoginExtras,
  ITotpVerifyResult,
} from "../types/api";

const DUMP_API_CALLS = process.env.LET_ME_IN === "1";
import { makeLogger, devNull } from "../logger";
import { normalize } from "idealizr";
import { BuildFileType } from "../buse/messages";
const logger = DUMP_API_CALLS ? makeLogger({}) : devNull;

type HTTPMethod = "get" | "head" | "post";

interface ITransformerMap {
  [key: string]: (input: any) => any;
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
   *
   * The body is:
   *   - transformed is transformers are passed
   *   - normalized if a schema is passed
   *   - camelified
   */
  async request(params: IRequestParams): Promise<any> {
    const { method, data, path } = params;

    const t1 = Date.now();

    const uri = `${this.rootUrl}${path}`;

    await this.cooldown();
    const t2 = Date.now();

    const resp = await this.requestFunc(method, uri, data, {});
    let body = resp.body;
    const t3 = Date.now();

    const shortPath = path.replace(/^\/[^\/]*\//, "");
    logger.info(
      `${t2 - t1}ms wait, ${t3 - t2}ms http, ${method} ${shortPath} ${
        data ? `with ${JSON.stringify(data)}` : ""
      }, ${fileSize(resp.size)} response`
    );

    if (resp.statusCode !== 200) {
      throw new Error(`HTTP ${resp.statusCode} ${path}`);
    }

    if (body.errors) {
      throw new ApiError(body.errors);
    }

    const { transformers } = params;
    if (transformers) {
      for (const key in transformers) {
        if (!transformers.hasOwnProperty(key)) {
          continue;
        }
        body[key] = transformers[key](body[key]);
      }
    }

    const { schema } = params;
    if (schema) {
      body = normalize(body, schema);
    }

    body = camelifyObject(body);

    return body;
  }

  /**
   * Log in using an API key
   */
  async loginKey(key: string): Promise<ILoginKeyResult> {
    return await this.request({
      method: "get",
      path: `/${key}/me`,
      data: {
        source: "desktop",
      },
    });
  }

  async loginWithPassword(
    username: string,
    password: string,
    extras: ILoginExtras
  ): Promise<ILoginWithPasswordResult> {
    let data: {
      username: string;
      password: string;
      source: "desktop";
      recaptcha_response?: string;
      v: number;
    } = {
      username: username,
      password: password,
      source: "desktop",
      v: 3,
    };
    if (extras.recaptchaResponse) {
      data.recaptcha_response = extras.recaptchaResponse;
    }

    return await this.request({ method: "post", path: "/login", data });
  }

  async totpVerify(token: string, code: string): Promise<ITotpVerifyResult> {
    const data = { token, code };
    return await this.request({ method: "post", path: "/totp/verify", data });
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

interface IRequestParams {
  method: HTTPMethod;
  path: string;
  data?: any;
  // TODO: remove when {}-instead-of-[] is fixed server-side
  transformers?: ITransformerMap;
  schema?: any;
}

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
  async request(params: IRequestParams): Promise<any> {
    if (!/^\//.test(params.path)) {
      throw new Error(
        `expecting API path to start with /, but got: ${params.path}`
      );
    }

    return await this.client.request({
      ...params,
      path: `/${this.key}${params.path}`,
    });
  }

  /**
   * Retrieve extended user info for user associated with API key
   */
  async me(): Promise<IMeResult> {
    return await this.request({ method: "get", path: "/me" });
  }

  /**
   * List all uploads for a game (that we have access to)
   */
  async listUploads(
    downloadKey: IDownloadKey,
    gameID: number,
    extras: IListUploadsExtras = {}
  ): Promise<IListUploadsResponse> {
    // TODO: adjust API to support download_key_id
    if (downloadKey) {
      return await this.request({
        method: "get",
        path: `/download-key/${downloadKey.id}/uploads`,
        data: extras,
        transformers: { uploads: ensureArray },
      });
    } else {
      return await this.request({
        method: "get",
        path: `/game/${gameID}/uploads`,
        data: extras,
        transformers: { uploads: ensureArray },
      });
    }
  }

  /**
   * Request a direct download URl for an upload
   */
  async downloadUpload(
    downloadKey: IDownloadKey,
    uploadID: number
  ): Promise<IDownloadUploadResult> {
    return await this.request({
      method: "get",
      path: `/upload/${uploadID}/download`,
      data: sprinkleDownloadKey(downloadKey, {}),
    });
  }

  /**
   * Return an itchfs URL to download an upload
   */
  downloadUploadURL(
    downloadKey: IDownloadKey,
    uploadID: number,
    extras: IPasswordOrSecret = {}
  ): string {
    return this.itchfsURL(
      `/upload/${uploadID}/download`,
      sprinkleDownloadKey(downloadKey, extras)
    );
  }

  /**
   * List the N most recent builds for a wharf-enabled upload
   */
  async listBuilds(
    downloadKey: IDownloadKey,
    uploadID: number
  ): Promise<IListBuildsResponse> {
    return await this.request({
      method: "get",
      path: `/upload/${uploadID}/builds`,
      data: sprinkleDownloadKey(downloadKey, {}),
      transformers: { builds: ensureArray },
    });
  }

  /**
   * Get detailed info for the given build of a given upload
   */
  async build(
    downloadKey: IDownloadKey,
    uploadID: number,
    buildID: number
  ): Promise<IBuildResponse> {
    return await this.request({
      method: "get",
      path: `/upload/${uploadID}/builds/${buildID}`,
      data: sprinkleDownloadKey(downloadKey, {}),
    });
  }

  /**
   * Return list of patches needed to upgrade to the latest build
   */
  async findUpgrade(
    downloadKey: IDownloadKey,
    uploadID: number,
    currentBuildID: number
  ): Promise<IUpgradeResponse> {
    return await this.request({
      method: "get",
      path: `/upload/${uploadID}/upgrade/${currentBuildID}`,
      data: sprinkleDownloadKey(downloadKey, { v: 2 }),
    });
  }

  /**
   * Download a given build
   */
  async downloadBuild(
    downloadKey: IDownloadKey,
    uploadID: number,
    buildID: number
  ): Promise<IDownloadBuildResult> {
    return await this.request({
      method: "get",
      path: `/upload/${uploadID}/download/builds/${buildID}`,
      data: sprinkleDownloadKey(downloadKey, { v: 2 }),
    });
  }

  /**
   * Returns the itchfs URL of a given build
   */
  downloadBuildURL(
    downloadKey: IDownloadKey,
    uploadID: number,
    buildID: number,
    fileType: BuildFileType,
    extras: IDownloadBuildFileExtras = {}
  ): string {
    const path = `/upload/${uploadID}/download/builds/${buildID}/${fileType}`;

    return this.itchfsURL(path, sprinkleDownloadKey(downloadKey, extras));
  }

  /**
   * Create a JWT token with a subset of our API key's permissions,
   * tied to a (valid) game ID.
   */
  async subkey(gameID: number, scope: string) {
    return await this.request({
      method: "post",
      path: "/credentials/subkey",
      data: {
        game_id: gameID,
        scope,
      },
    });
  }

  //--------------------------------------------------------------------
  // Normalized methods
  //--------------------------------------------------------------------

  /**
   * Fetch a single user by ID
   * (Normalized)
   */
  async user(userID: number): Promise<IUserResult> {
    return await this.request({
      method: "get",
      path: `/users/${userID}`,
      schema: { user: schemas.user },
    });
  }

  /**
   * Fetch a single collection by ID
   * (Normalized)
   */
  async collection(collectionID: number): Promise<ICollectionResult> {
    return await this.request({
      method: "get",
      path: `/collection/${collectionID}`,
      schema: {
        collection: schemas.collection,
      },
    });
  }

  /**
   * Retrieve a single game by ID
   * (Normalized)
   */
  async game(
    gameID: number,
    gameExtras: IGameExtras = {}
  ): Promise<IGameResult> {
    return await this.request({
      method: "get",
      path: `/game/${gameID}`,
      data: gameExtras,
      schema: {
        game: schemas.game,
      },
    });
  }

  /**
   * Retrieve games ones create or is a game admin for.
   * (Normalized)
   */
  async myGames(): Promise<IMyGamesResult> {
    // Note: this endpoint is not paginated
    return await this.request({
      method: "get",
      path: "/my-games",
      transformers: { games: ensureArray },
      schema: {
        games: schemas.arrayOf(schemas.game),
      },
    });
  }

  /**
   * Retrieve download keys linked to this account
   * (Normalized)
   */
  async myOwnedKeys(page = 1): Promise<IMyOwnedKeysResult> {
    // Note: this endpoint is paginated, but
    // does not return `page` or `per_page`
    return await this.request({
      method: "get",
      path: "/my-owned-keys",
      data: { page },
      transformers: { owned_keys: ensureArray },
      schema: {
        owned_keys: schemas.arrayOf(schemas.downloadKey),
      },
    });
  }

  /**
   * Fetch a page of games from a collection
   * (Normalized)
   */
  async collectionGames(
    collectionID: number,
    page = 1
  ): Promise<ICollectionGamesResult> {
    return await this.request({
      method: "get",
      path: `/collection/${collectionID}/games`,
      data: { page },
      schema: {
        games: schemas.arrayOf(schemas.game),
      },
    });
  }

  /**
   * Fetch all user collections
   * (Normalized)
   */
  async myCollections(): Promise<IMyCollectionsResult> {
    // Note: this endpoint is not paginated
    return await this.request({
      method: "get",
      path: "/my-collections",
      transformers: { collections: ensureArray },
      schema: {
        collections: schemas.arrayOf(schemas.collection),
      },
    });
  }

  /**
   * Do a text search for games
   * (Normalized)
   */
  async searchGames(query: string): Promise<ISearchGamesResult> {
    return await this.request({
      method: "get",
      path: "/search/games",
      data: { query },
      transformers: { games: ensureArray },
      schema: {
        games: schemas.arrayOf(schemas.game),
      },
    });
  }

  /**
   * Do a text search for users
   * (Normalized)
   */
  async searchUsers(query: string): Promise<ISearchUsersResult> {
    return await this.request({
      method: "get",
      path: "/search/users",
      data: { query },
      transformers: { users: ensureArray },
      schema: {
        users: schemas.arrayOf(schemas.user),
      },
    });
  }
}

/**
 * if not an array, return the empty array, otherwise identity
 * cf. https://github.com/itchio/itch/issues/48
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
  params: any
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
