
import * as invariant from "invariant";

import mklog from "./log";
const log = mklog("fetch");
import {opts} from "../logger";

import client from "./api";

import GameModel from "../models/game";

import {normalize, arrayOf} from "./idealizr";
import {game, user, collection, downloadKey} from "./schemas";
import {each, union, pluck, difference, contains} from "underscore";

import {
  IUserMarket, IGlobalMarket,
  IUserRecord, IGameRecord, ICollectionRecord, ICredentials,
  IDownloadKey, ICaveRecord,
} from "../types";

// TODO: don't use any in any of the return types here

export async function dashboardGames (market: IUserMarket, credentials: ICredentials) {
  const {key, me} = credentials;
  const api = client.withKey(key);

  // TODO: figure out what the typeorm equivalent of `fields` is
  const oldGames = await market.getRepo(GameModel).find({userId: me.id});
  const oldGameIds = pluck(oldGames, "id");

  const normalized = normalize(await api.myGames(), {
    games: arrayOf(game),
  });

  // the 'myGames' endpoint doesn't set the userId
  // AND might return games you're not the user of
  if (!normalized.entities.games) {
    normalized.entities.games = {};
  }
  each(normalized.entities.games, (g: IGameRecord) => { g.userId = g.userId || me.id; });
  normalized.entities.users = {
    [me.id]: me,
  };
  normalized.entities.itchAppProfile = {
    myGames: {
      ids: pluck(normalized.entities.games, "id"),
    },
  };
  await market.saveAllEntities(normalized);

  const newGameIds = pluck(normalized.entities.games, "id");
  const goners = difference(oldGameIds, newGameIds);
  if (goners.length > 0) {
    await market.deleteAllEntities({entities: {games: goners}});
  }
}

export async function ownedKeys (
    market: IUserMarket, globalMarket: IGlobalMarket, credentials: ICredentials): Promise<void> {
  const {key} = credentials;
  const api = client.withKey(key);

  const oldKeyIds = pluck(market.getEntities<IDownloadKey>("downloadKeys"), "id");
  let newKeyIds: number[] = [];

  let page = 0;

  while (true) {
    const response = await api.myOwnedKeys({page: page++});
    if (response.ownedKeys.length === 0) {
      break;
    }

    newKeyIds = [...newKeyIds, ...pluck(response.ownedKeys, "id")];

    await market.saveAllEntities(normalize(response, {
      ownedKeys: arrayOf(downloadKey),
    }));
  }

  // any keys been revoked? we can't use those to download anymore, remove
  // them from local db & strip them from cave records.
  const goners = difference(oldKeyIds, newKeyIds);
  if (goners.length > 0) {
    log(opts, `Cleaning up ${goners.length} gone download keys`);
    market.deleteAllEntities({entities: {downloadKeys: goners}});

    let touchedCaves = 0;    
    const allCaves = globalMarket.getEntities<ICaveRecord>("caves");
    each(allCaves, (cave, caveId) => {
      if (cave.downloadKey && contains(goners, cave.downloadKey.id)) {
        globalMarket.saveEntity("caves", caveId, {downloadKey: null});
        touchedCaves++;
      }
    });

    log(opts, `${touchedCaves} caves affected`);
  }
}

export async function collections (market: IUserMarket, credentials: ICredentials): Promise<void> {
  const oldCollectionIds = pluck(market.getEntities<ICollectionRecord>("collections"), "id");

  const prepareCollections = (normalized: any) => {
    const colls = market.getEntities<ICollectionRecord>("collections");
    each(normalized.entities.collections, (coll: ICollectionRecord, collectionID: number) => {
      const old = colls[collectionID];
      if (old) {
        coll.gameIds = union(old.gameIds, coll.gameIds);
      }
    });
    return normalized;
  };

  const {key} = credentials;
  const api = client.withKey(key);

  const myCollectionsRes = normalize(await api.myCollections(), {
    collections: arrayOf(collection),
  });
  await market.saveAllEntities(prepareCollections(myCollectionsRes));

  let newCollectionIds = pluck(myCollectionsRes.entities.collections, "id");

  const goners = difference(oldCollectionIds, newCollectionIds);
  if (goners.length > 0) {
    market.deleteAllEntities({entities: {collections: goners}});
  }
}

export async function collectionGames
    (market: IUserMarket, credentials: ICredentials, collectionID: number): Promise<void> {
  let collection = market.getEntity<ICollectionRecord>("collections", String(collectionID));
  if (!collection) {
    log(opts, `collection not found: ${collectionID}, stack = ${(new Error()).stack}`);
    return;
  }

  const api = client.withKey(credentials.key);

  let page = 1;
  let fetched = 0;
  let totalItems = 1;
  let fetchedGameIDs = [] as number[];
  const localGameIds = collection.gameIds || [];

  while (fetched < totalItems) {
    let res = await api.collectionGames(collectionID, page);
    totalItems = res.totalItems;
    fetched = res.perPage * page;

    const normalized = normalize(res, {games: arrayOf(game)});
    const pageGameIds = pluck(normalized.entities.games, "id");
    fetchedGameIDs = [
      ...fetchedGameIDs,
      ...pageGameIds,
    ];

    collection = {
      ...collection,
      gameIds: union(localGameIds, fetchedGameIDs),
    };

    await market.saveEntity("collections", String(collection.id), collection);
    await market.saveAllEntities(normalized);
    page++;
  }

  // if games were removed remotely, they'll be removed locally at this step
  collection = {
    ...collection,
    gameIds: fetchedGameIDs,
  };
  await market.saveEntity("collections", String(collection.id), collection);
}

interface IGameSearchResults {
  entities: {
    games: {
      [key: string]: IGameRecord;
    },
  };
}

interface IUserSearchResults {
  entities: {
    users: {
      [key: string]: IUserRecord;
    },
  };
}

interface ISearchResults {
  gameResults: IGameSearchResults;
  userResults: IUserSearchResults;
}

export async function search (credentials: ICredentials, query: string): Promise<ISearchResults> {
  invariant(typeof query === "string", "search has string query");

  const api = client.withKey(credentials.key);

  const gameResults = normalize(await api.searchGames(query), {
    games: arrayOf(game),
  }) as IGameSearchResults;
  const userResults = normalize(await api.searchUsers(query), {
    users: arrayOf(user),
  }) as IUserSearchResults;

  return {
    gameResults,
    userResults,
  };
}

interface IGameLazilyOpts {
  fresh?: boolean;
  game?: IGameRecord;
  password?: string; // for password-protected games
  secret?: string; // for draft games
}

async function gameLazily (market: IUserMarket, credentials: ICredentials, gameId: number,
                           opts = {} as IGameLazilyOpts): Promise<IGameRecord> {
  invariant(typeof market === "object", "gameLazily has market");
  invariant(typeof credentials === "object", "gameLazily has credentials");
  invariant(typeof gameId === "number", "gameLazily has gameId number");

  if (!opts.fresh) {
    let record = market.getEntity<IGameRecord>("games", String(gameId));
    if (record) {
      return record;
    }

    record = opts.game;
    if (record) {
      return record;
    }
  }

  const api = client.withKey(credentials.key);
  const {password, secret} = opts;
  const response = normalize(await api.game(gameId, {password, secret}), {game});

  return response.entities.games[gameId];
}

interface IUserLazilyOpts {
  fresh?: boolean;
}

export async function userLazily (market: IUserMarket, credentials: ICredentials, userID: number,
                                  opts = {} as IUserLazilyOpts): Promise<IUserRecord> {
  invariant(typeof market === "object", "userLazily has market");
  invariant(typeof credentials === "object", "userLazily has credentials");
  invariant(typeof userID === "number", "userLazily has userId number");

  if (!opts.fresh) {
    const record = market.getEntity<IUserRecord>("users", String(userID));
    if (record) {
      return record;
    }
  }

  const api = client.withKey(credentials.key);
  const response = normalize(await api.user(userID), {user});
  return response.entities.users[userID];
}

interface ICollectionLazilyOpts {
  fresh?: boolean;
}

export async function collectionLazily (market: IUserMarket, credentials: ICredentials, collectionId: number,
                                        opts = {} as ICollectionLazilyOpts): Promise<ICollectionRecord> {
  const oldRecord = market.getEntity<ICollectionRecord>("collections", String(collectionId));
  if (!opts.fresh) {
    if (oldRecord) {
      return oldRecord;
    }
  }

  const api = client.withKey(credentials.key);
  const response = normalize(await api.collection(collectionId), {collection});
  return {...oldRecord, ...response.entities.collections[collectionId]};
}

export default {
  dashboardGames,
  ownedKeys,
  collections,
  collectionGames,
  search,
  gameLazily,
  userLazily,
  collectionLazily,
};
