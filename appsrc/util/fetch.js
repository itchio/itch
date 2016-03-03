
import mklog from './log'
const log = mklog('fetch')
const opts = {logger: new mklog.Logger()}

import CredentialsStore from '../stores/credentials-store'

import {assocIn} from 'grovel'
import {normalize, arrayOf} from 'idealizr'
import {game, collection, download_key} from './schemas'
import {each, union, pluck, where, difference} from 'underline'

async function dashboard_games (market, cb) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof cb === 'function'
  }

  cb()

  const api = CredentialsStore.get_current_user()
  const me = CredentialsStore.get_me()

  const old_game_ids = market.get_entities('games')::where({user_id: me.id})::pluck('id')

  const normalized = normalize(await api.my_games(), {
    games: arrayOf(game)
  })

  // the `my_games` endpoint doesn't set the user_id
  normalized.entities.games::each((g) => g.user_id = me.id)
  normalized.entities.users = {
    [me.id]: me
  }
  market.save_all_entities(normalized)

  const new_game_ids = normalized.entities.games::pluck('id')
  const goners = old_game_ids::difference(new_game_ids)
  if (goners.length > 0) {
    market.delete_all_entities({entities: {games: goners}})
  }
  cb()
}

async function owned_keys (market, cb) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof cb === 'function'
  }

  cb()

  const api = CredentialsStore.get_current_user()
  let page = 0

  while (true) {
    const response = await api.my_owned_keys({page: page++})
    if (response.owned_keys.length === 0) {
      break
    }

    market.save_all_entities(normalize(response, {
      owned_keys: arrayOf(download_key)
    }))
    cb()
  }
}

async function collections (market, featured_ids, cb) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    Array.isArray(featured_ids)
    typeof cb === 'function'
  }

  cb()

  const old_collection_ids = market.get_entities('collections')::pluck('id')

  const prepare_collections = (normalized) => {
    const colls = market.get_entities('collections')
    normalized.entities.collections::each((coll, coll_id) => {
      const old = colls[coll_id]
      if (old) {
        coll.game_ids = old.game_ids::union(coll.game_ids)
      }
    })
    return normalized
  }

  const api = CredentialsStore.get_current_user()
  if (!api) return

  const my_collections_res = normalize(await api.my_collections(), {
    collections: arrayOf(collection)
  })
  market.save_all_entities(prepare_collections(my_collections_res))
  cb()

  let new_collection_ids = my_collections_res.entities.collections::pluck('id')

  for (const featured_id of featured_ids) {
    const featured_collection_res = normalize(await api.collection(featured_id), {
      collection: collection
    })

    new_collection_ids = new_collection_ids::union(featured_collection_res.entities.collections::pluck('id'))
    market.save_all_entities(prepare_collections(featured_collection_res))
    cb()
  }

  const goners = old_collection_ids::difference(new_collection_ids)
  if (goners.length > 0) {
    market.delete_all_entities({entities: {collections: goners}})
    cb()
  }
}

async function collection_games (market, collection_id, cb) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof collection_id === 'number'
    typeof cb === 'function'
  }

  let collection = market.get_entities('collections')[collection_id]
  if (!collection) {
    log(opts, `collection not found: ${collection_id}`)
    return
  }

  cb()

  const api = CredentialsStore.get_current_user()

  let page = 1
  let fetched = 0
  let total_items = 1
  let fetched_game_ids = []

  while (fetched < total_items) {
    let res = await api.collection_games(collection_id, page)
    total_items = res.total_items
    fetched = res.per_page * page

    const normalized = normalize(res, {games: arrayOf(game)})
    const page_game_ids = normalized.entities.games::pluck('id')
    collection = collection::assocIn(['game_ids'], collection.game_ids::union(page_game_ids))
    market.save_all_entities({entities: {collections: {[collection.id]: collection}}})

    fetched_game_ids = fetched_game_ids::union(page_game_ids)
    market.save_all_entities(normalized)
    cb()
    page++
  }

  // if games were removed remotely, they'll be removed locally at this step
  collection = collection::assocIn(['game_ids'], fetched_game_ids)
  market.save_all_entities({entities: {collections: {[collection.id]: collection}}})
  cb()
}

async function search (query) {
  pre: { // eslint-disable-line
    typeof query === 'string'
  }

  const api = CredentialsStore.get_current_user()

  const response = normalize(await api.search(query), {
    games: arrayOf(game)
  })
  return response.entities.games || {}
}

async function game_lazily (market, game_id) {
  pre: { // eslint-disable-line
    typeof market === 'object'
    typeof game_id === 'number'
  }

  const record = market.get_entities('games')[game_id]
  if (record) {
    return record
  }

  const api = CredentialsStore.get_current_user()
  const response = normalize(await api.game(game_id), {game})

  // TODO: re-use the 'user' this endpoint gives us?
  // thinking about layered markets, e.g.:
  //  < looking for a user >
  //  |-> [ query market - contains temporary data related to a search ]
  //  |-> [ main market - contains persistent data (own games, owned games, games in collection) ]
  // at least, market shouldn't be a singleton
  return response.entities.games[game_id]
}

export default {
  dashboard_games,
  owned_keys,
  collections,
  collection_games,
  search,
  game_lazily
}
