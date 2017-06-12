
import * as invariant from "invariant";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "fetch"});

import client from "../api";
import normalize from "../api/normalize";
import {game, user, collection, downloadKey} from "../api/schemas";

import {arrayOf} from "idealizr";
import {union, pluck, difference} from "underscore";

import db from "../db";
import UserModel from "../db/models/user";
import GameModel from "../db/models/game";
import CollectionModel from "../db/models/collection";
import DownloadKeyModel from "../db/models/download-key";

import {
  IUserRecord, IGameRecord, ICollectionRecord, ICredentials, ICaveRecord,
} from "../types";

// TODO: don't use any in any of the return types here

// FIXME: db
export async function dashboardGames (credentials: ICredentials) {
  const {key, me} = credentials;
  const api = client.withKey(key);

  // TODO: figure out what the typeorm equivalent of `fields` is
  const oldGames = await db.getRepo(GameModel).find({userId: me.id});
  const oldGameIds = pluck(oldGames, "id");

  const apiResponse = await api.myGames();
  const normalized = normalize(apiResponse, {
    games: arrayOf(game),
  });
  const entities = normalized.entities as {
    games: { [key: string]: IGameRecord }
    users: { [key: string]: IUserRecord }
    itchAppProfile: { myGames: { ids: number[]; } }
  };

  // the 'myGames' endpoint doesn't set the userId
  // AND might return games you're not the user of
  if (!entities.games) {
    entities.games = {};
  }
  for (const gameId of Object.keys(entities.games)) {
    // FIXME: remove once the api returns userId for the /my-games
    const game = entities.games[gameId];
    if (!game.userId) {
      game.userId = me.id;
    }
  }
  entities.users = {
    [me.id]: me,
  };

  const newGameIds = pluck(entities.games, "id");
  entities.itchAppProfile = {
    myGames: {
      ids: newGameIds,
    },
  };
  // TODO: get rid of any?
  await db.saveMany<any>({entities});

  const goners = difference(oldGameIds, newGameIds);
  if (goners.length > 0) {
    logger.info(`After /my-games, removing ${goners.length} goners: ${JSON.stringify(goners)}`)
    await db.deleteAllEntities({entities: {games: goners}});
  }
}

// FIXME: db
export async function ownedKeys (credentials: ICredentials): Promise<void> {
  const {key} = credentials;
  const api = client.withKey(key);

  const keyRepo = db.getRepo(DownloadKeyModel);

  // TODO: figure out the typeorm equivalen of 'fields'
  const oldKeys = await keyRepo.find();
  const oldKeyIds = pluck(oldKeys, "id");
  let newKeyIds: number[] = [];

  let page = 0;

  while (true) {
    const response = await api.myOwnedKeys({page: page++});
    if (response.ownedKeys.length === 0) {
      break;
    }

    newKeyIds = [...newKeyIds, ...pluck(response.ownedKeys, "id")];

    await db.saveMany(normalize(response, {
      ownedKeys: arrayOf(downloadKey),
    }));
  }

  // any keys been revoked? we can't use those to download anymore, remove
  // them from local db & strip them from cave records.
  const goners = difference(oldKeyIds, newKeyIds);
  if (goners.length > 0) {
    logger.info(`Cleaning up ${goners.length} gone download keys`);
    db.deleteAllEntities({entities: {downloadKeys: goners}});

    // we used to clean up caves as well, but with the single db
    // scheme (v25+), download keys are no longer stored in caves.
  }
}

export async function collections (credentials: ICredentials): Promise<void> {
  const collectionRepo = db.getRepo(CollectionModel);

  const oldCollections = await collectionRepo
    .createQueryBuilder("c")
    .select("id")
    .where("c.userId = :userId", {userId: credentials.me.id})
    .getRawMany();
  const oldCollectionIds = pluck(oldCollections, "id");

  const {key} = credentials;
  const api = client.withKey(key);

  const normalized = normalize(await api.myCollections(), {
    collections: arrayOf(collection),
  });
  const {entities} = normalized;
  await db.saveMany({entities});

  const newCollectionIds = pluck(entities.collections, "id");
  const goners = difference(oldCollectionIds, newCollectionIds);
  if (goners.length > 0) {
    // FIXME: this is the wrong place to do that.
    // what if a collection changes owners? we'll delete it unnecessarily.
    // this should be a "garbage collection" step that takes all users into account
    logger.info(`After /my-collections, removing ${goners.length} goners: ${JSON.stringify(goners)}`);
    db.deleteAllEntities({entities: {collections: goners}});
  }
}

export async function collectionGames
    (credentials: ICredentials, collectionId: number): Promise<void> {

  let collection = await db.getRepo(CollectionModel).findOneById(collectionId);
  if (!collection) {
    logger.warn(`collection not found: ${collectionId}, stack = ${(new Error()).stack}`);
    return;
  }

  const api = client.withKey(credentials.key);

  let page = 1;
  let fetched = 0;
  let totalItems = 1;
  let fetchedGameIDs = [] as number[];
  const localGameIds = collection.gameIds || [];

  while (fetched < totalItems) {
    let res = await api.collectionGames(collectionId, page);
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

    await db.saveOne("collections", String(collection.id), collection);
    await db.saveMany(normalized);
    page++;
  }

  // if games were removed remotely, they'll be removed locally at this step
  collection = {
    ...collection,
    gameIds: fetchedGameIDs,
  };
  await db.saveOne("collections", String(collection.id), collection);
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

  // typing is fun!
  const gameResults = normalize(await api.searchGames(query), {
    games: arrayOf(game),
  }) as any as IGameSearchResults;

  // typing is fun!
  const userResults = normalize(await api.searchUsers(query), {
    users: arrayOf(user),
  }) as any as IUserSearchResults;

  return {
    gameResults,
    userResults,
  };
}

interface IGameLazilyOpts {
  fresh?: boolean;
  game?: GameModel;
  password?: string; // for password-protected games
  secret?: string; // for draft games
}

async function gameLazily (credentials: ICredentials, gameId: number,
                           opts = {} as IGameLazilyOpts): Promise<GameModel> {
  invariant(typeof credentials === "object", "gameLazily has credentials");
  invariant(typeof gameId === "number", "gameLazily has gameId number");

  const gameRepo = db.getRepo(GameModel);

  if (!opts.fresh) {
    let record = await gameRepo.findOneById(gameId);
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

export async function userLazily (credentials: ICredentials, userID: number,
                                  opts = {} as IUserLazilyOpts): Promise<UserModel> {
  invariant(typeof credentials === "object", "userLazily has credentials");
  invariant(typeof userID === "number", "userLazily has userId number");

  if (!opts.fresh) {
    const record = await db.getRepo(UserModel).findOneById(userID);
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

// FIXME: db
export async function collectionLazily (market: any, credentials: ICredentials, collectionId: number,
                                        opts = {} as ICollectionLazilyOpts): Promise<ICollectionRecord> {
  const oldRecord = market.getEntity("collections", String(collectionId));
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
