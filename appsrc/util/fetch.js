
import mklog from './log'
const log = mklog('fetch')
import {opts} from '../logger'

import client from '../util/api'

import {assocIn} from 'grovel'
import {normalize, arrayOf} from './idealizr'
import {game, user, collection, downloadKey} from './schemas'
import {each, union, pluck, where, difference} from 'underline'

export async function dashboardGames (market, credentials) {
  pre: { // eslint-disable-line
    typeof market === 'object'
  }

  const {key, me} = credentials
  const api = client.withKey(key)

  const oldGameIds = market.getEntities('games')::where({userId: me.id})::pluck('id')

  const normalized = normalize(await api.myGames(), {
    games: arrayOf(game)
  })

  // the 'myGames' endpoint doesn't set the userId
  // AND might return games you're not the user of
  normalized.entities.games::each((g) => { g.userId = g.userId || me.id })
  normalized.entities.users = {
    [me.id]: me
  }
  normalized.entities.itchAppProfile = {
    myGames: {
      ids: normalized.entities.games::pluck('id')
    }
  }
  market.saveAllEntities(normalized)

  const newGameIds = normalized.entities.games::pluck('id')
  const goners = oldGameIds::difference(newGameIds)
  if (goners.length > 0) {
    market.deleteAllEntities({entities: {games: goners}})
  }
}

export async function ownedKeys (market, credentials) {
  pre: { // eslint-disable-line
    typeof market === 'object'
  }

  const {key} = credentials
  const api = client.withKey(key)

  let page = 0

  while (true) {
    const response = await api.myOwnedKeys({page: page++})
    if (response.ownedKeys.length === 0) {
      break
    }

    market.saveAllEntities(normalize(response, {
      ownedKeys: arrayOf(downloadKey)
    }))
  }
}

export async function collections (market, credentials) {
  pre: { // eslint-disable-line
    typeof market === 'object'
  }

  const oldCollectionIds = market.getEntities('collections')::pluck('id')

  const prepareCollections = (normalized) => {
    const colls = market.getEntities('collections')
    normalized.entities.collections::each((coll, collId) => {
      const old = colls[collId]
      if (old) {
        coll.gameIds = old.gameIds::union(coll.gameIds)
      }
    })
    return normalized
  }

  const {key} = credentials
  const api = client.withKey(key)

  const myCollectionsRes = normalize(await api.myCollections(), {
    collections: arrayOf(collection)
  })
  market.saveAllEntities(prepareCollections(myCollectionsRes))

  let newCollectionIds = myCollectionsRes.entities.collections::pluck('id')

  const goners = oldCollectionIds::difference(newCollectionIds)
  if (goners.length > 0) {
    market.deleteAllEntities({entities: {collections: goners}})
  }
}

export async function collectionGames (market, credentials, collectionId) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof collectionId === 'number'
  }

  let collection = market.getEntities('collections')[collectionId]
  if (!collection) {
    log(opts, `collection not found: ${collectionId}`)
    return
  }

  const api = client.withKey(credentials.key)

  let page = 1
  let fetched = 0
  let totalItems = 1
  let fetchedGameIds = []

  while (fetched < totalItems) {
    let res = await api.collectionGames(collectionId, page)
    totalItems = res.totalItems
    fetched = res.perPage * page

    const normalized = normalize(res, {games: arrayOf(game)})
    const pageGameIds = normalized.entities.games::pluck('id')
    collection = collection::assocIn(['gameIds'], collection.gameIds::union(pageGameIds))
    market.saveAllEntities({entities: {collections: {[collection.id]: collection}}})

    fetchedGameIds = fetchedGameIds::union(pageGameIds)
    market.saveAllEntities(normalized)
    page++
  }

  // if games were removed remotely, they'll be removed locally at this step
  collection = collection::assocIn(['gameIds'], fetchedGameIds)
  market.saveAllEntities({entities: {collections: {[collection.id]: collection}}})
}

export async function search (credentials, query) {
  pre: { // eslint-disable-line
    typeof query === 'string'
  }

  const api = client.withKey(credentials.key)

  const response = normalize(await api.search(query), {
    games: arrayOf(game)
  })
  return response
}

export async function gameLazily (market, credentials, gameId, opts = {}) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof credentials === 'object'
    typeof gameId === 'number'
  }

  if (!opts.fresh) {
    const record = market.getEntities('games')[gameId]
    if (record) {
      return record
    }
  }

  const api = client.withKey(credentials.key)
  const response = normalize(await api.game(gameId), {game})

  // TODO: re-use the 'user' this endpoint gives us?
  // thinking about layered markets, e.g.:
  //  < looking for a user >
  //  |-> [ query market - contains temporary data related to a search ]
  //  |-> [ main market - contains persistent data (own games, owned games, games in collection) ]
  // at least, market shouldn't be a singleton
  return response.entities.games[gameId]
}

export async function userLazily (market, credentials, userId, opts = {}) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof credentials === 'object'
    typeof userId === 'number'
  }

  if (!opts.fresh) {
    const record = market.getEntities('users')[userId]
    if (record) {
      return record
    }
  }

  const api = client.withKey(credentials.key)
  const response = normalize(await api.user(userId), {user})
  return response.entities.users[userId]
}

export async function collectionLazily (market, credentials, collectionId, opts = {}) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof credentials === 'object'
    typeof collectionId === 'number'
  }

  const oldRecord = market.getEntities('collections')[collectionId]
  if (!opts.fresh) {
    if (oldRecord) {
      return oldRecord
    }
  }

  const api = client.withKey(credentials.key)
  const response = normalize(await api.collection(collectionId), {collection})
  return {
    ...oldRecord,
    ...response.entities.collections[collectionId]
  }
}

export default {
  dashboardGames,
  ownedKeys,
  collections,
  collectionGames,
  search,
  gameLazily,
  userLazily,
  collectionLazily
}
