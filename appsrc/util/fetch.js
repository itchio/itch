
import mklog from './log'
const log = mklog('fetch')
import {opts} from '../logger'

import client from '../util/api'

import {assocIn} from 'grovel'
import {normalize, arrayOf} from './idealizr'
import {game, collection, downloadKey} from './schemas'
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

  // the `myGames` endpoint doesn't set the userId
  normalized.entities.games::each((g) => g.userId = me.id)
  normalized.entities.users = {
    [me.id]: me
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

export async function collections (market, credentials, featuredIds) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    Array.isArray(featuredIds)
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

  // TODO: error handling
  newCollectionIds = newCollectionIds::union(featuredIds)
  const featuredReqs = await Promise.all(featuredIds.map(::api.collection))

  for (const featuredReq of featuredReqs) {
    const featuredCollectionRes = normalize(featuredReq, {
      collection: collection
    })
    market.saveAllEntities(prepareCollections(featuredCollectionRes))
  }

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

export async function gameLazily (market, credentials, gameId) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof gameId === 'number'
  }

  const record = market.getEntities('games')[gameId]
  if (record) {
    return record
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

export default {
  dashboardGames,
  ownedKeys,
  collections,
  collectionGames,
  search,
  gameLazily
}
