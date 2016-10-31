
import * as invariant from "invariant";

import mklog from "./log";
const log = mklog("fetch");
import {opts} from "../logger";

import client from "./api";

import {normalize, arrayOf} from "./idealizr";
import {game, user, collection, downloadKey} from "./schemas";
import {each, union, pluck, values, where, difference, findWhere} from "underscore";

import Market from "./market";

import {IUserRecord, IGameRecord, ICollectionRecord, ICredentials} from "../types/db";

// TODO: don't use any in any of the return types here

export async function dashboardGames (market: Market, credentials: ICredentials) {
  const {key, me} = credentials;
  const api = client.withKey(key);

  const oldGameIds = pluck(
    where(
      values(market.getEntities("games")),
      {userId: me.id},
    ),
    "id",
  );

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
  market.saveAllEntities(normalized);

  const newGameIds = pluck(normalized.entities.games, "id");
  const goners = difference(oldGameIds, newGameIds);
  if (goners.length > 0) {
    market.deleteAllEntities({entities: {games: goners}});
  }
}

export async function ownedKeys (market: Market, credentials: ICredentials): Promise<void> {
  const {key} = credentials;
  const api = client.withKey(key);

  let page = 0;

  while (true) {
    const response = await api.myOwnedKeys({page: page++});
    if (response.ownedKeys.length === 0) {
      break;
    }

    market.saveAllEntities(normalize(response, {
      ownedKeys: arrayOf(downloadKey),
    }));
  }
}

export async function collections (market: Market, credentials: ICredentials): Promise<void> {
  const oldCollectionIds = pluck(values(market.getEntities("collections")), "id");

  const prepareCollections = (normalized: any) => {
    const colls = market.getEntities("collections");
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
  market.saveAllEntities(prepareCollections(myCollectionsRes));

  let newCollectionIds = pluck(myCollectionsRes.entities.collections, "id");

  const goners = difference(oldCollectionIds, newCollectionIds);
  if (goners.length > 0) {
    market.deleteAllEntities({entities: {collections: goners}});
  }
}

export async function collectionGames (market: Market, credentials: ICredentials, collectionID: number): Promise<void> {
  let collection = market.getEntities("collections")[collectionID];
  if (!collection) {
    log(opts, `collection not found: ${collectionID}, stack = ${(new Error()).stack}`);
    return;
  }

  const api = client.withKey(credentials.key);

  let page = 1;
  let fetched = 0;
  let totalItems = 1;
  let fetchedGameIDs = [] as Array<number>;

  while (fetched < totalItems) {
    let res = await api.collectionGames(collectionID, page);
    totalItems = res.totalItems;
    fetched = res.perPage * page;

    const normalized = normalize(res, {games: arrayOf(game)});
    const pageGameIds = pluck(normalized.entities.games, "id");
    collection = Object.assign({}, collection, {
      gameIds: [
        ...(collection.gameIds || []),
        ...pageGameIds,
      ],
    });
    market.saveAllEntities({entities: {collections: {[collection.id]: collection}}});

    fetchedGameIDs = [
      ...fetchedGameIDs,
      ...pageGameIds,
    ];
    market.saveAllEntities(normalized);
    page++;
  }

  // if games were removed remotely, they'll be removed locally at this step
  collection = Object.assign({}, collection, {
    gameIds: fetchedGameIDs,
  });
  market.saveAllEntities({entities: {collections: {[collection.id]: collection}}});
}

interface IGameSearchResults {
  entities: {
    games: {
      [key: string]: IGameRecord;
    }
  };
}

interface IUserSearchResults {
  entities: {
    users: {
      [key: string]: IUserRecord;
    }
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
}

async function gameLazily (market: Market, credentials: ICredentials, gameId: number,
                                  opts = {} as IGameLazilyOpts): Promise<IGameRecord> {
  invariant(typeof market === "object", "gameLazily has market");
  invariant(typeof credentials === "object", "gameLazily has credentials");
  invariant(typeof gameId === "number", "gameLazily has gameId number");

  if (!opts.fresh) {
    let record = market.getEntities("games")[gameId];
    if (record) {
      return record;
    }

    record = opts.game;
    if (record) {
      return record;
    }
  }

  const api = client.withKey(credentials.key);
  const response = normalize(await api.game(gameId), {game});

  return response.entities.games[gameId];
}

interface IUserLazilyOpts {
  fresh?: boolean;
}

export async function userLazily (market: Market, credentials: ICredentials, userID: number,
                                  opts = {} as IUserLazilyOpts): Promise<IUserRecord> {
  invariant(typeof market === "object", "userLazily has market");
  invariant(typeof credentials === "object", "userLazily has credentials");
  invariant(typeof userID === "number", "userLazily has userId number");

  if (!opts.fresh) {
    const record = market.getEntities("users")[userID];
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

export async function collectionLazily (market: Market, credentials: ICredentials, collectionID: number,
                                        opts = {} as ICollectionLazilyOpts): Promise<ICollectionRecord> {
  const oldRecord = market.getEntities("collections")[collectionID];
  if (!opts.fresh) {
    if (oldRecord) {
      return oldRecord;
    }
  }

  const api = client.withKey(credentials.key);
  const response = normalize(await api.collection(collectionID), {collection});
  return Object.assign({}, oldRecord, response.entities.collections[collectionID]);
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
