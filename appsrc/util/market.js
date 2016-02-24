
let Logger = require('../util/log').Logger
let log = require('../util/log')('market')
let opts = {logger: new Logger({sinks: {console: true}})}

import { each, union, pluck } from 'underline'
import { normalize, Schema, arrayOf } from 'normalizr'
let CredentialsStore = require('../stores/credentials-store')

const user = new Schema('users')
const game = new Schema('games')
const collection = new Schema('collections')
const download_key = new Schema('download_keys')

game.define({
  user: user
})

collection.define({
  games: arrayOf(game)
})

download_key.define({
  game: game
})

async function fetch_dashboard_games (cb) {
  cb()

  let api = CredentialsStore.get_current_user()
  let me = CredentialsStore.get_me()

  let normalized = normalize(await api.my_games(), {
    games: arrayOf(game)
  })

  normalized.entities.games::each((g) => g.user = me.id)
  normalized.entities.users = {
    [me.id]: me
  }
  save_all_entities(normalized)

  cb()
}

async function fetch_owned_keys (cb) {
  cb()

  let api = CredentialsStore.get_current_user()
  let page = 0
  let running = true

  while (running) {
    let response = await api.my_owned_keys({page: page++})
    save_all_entities(normalize(response, {
      owned_keys: arrayOf(download_key)
    }))
    cb()
    running = response.owned_keys.length > 0
  }

  cb()
}

async function fetch_collections (featured_ids, cb) {
  cb()

  let prepare_collections = (normalized) => {
    let colls = get_entities('collections')
    normalized.entities.collections::each((coll, coll_id) => {
      let old = colls[coll_id]
      if (old) {
        coll.games = old.games::union(coll.games)
      }
    })
    return normalized
  }

  let api = CredentialsStore.get_current_user()
  if (!api) return

  let my_collections_res = await api.my_collections()
  let my_collections = normalize(my_collections_res, {
    collections: arrayOf(collection)
  })
  ;(my_collections.entities.collections || [])::each((c) => c._featured = false)
  save_all_entities(prepare_collections(my_collections))
  cb()

  for (let featured_id of featured_ids) {
    let featured_collection_res = await api.collection(featured_id)
    let featured_collection = normalize(featured_collection_res, {
      collection: collection
    })
    ;(featured_collection.entities.collections || [])::each((c) => c._featured = true)
    save_all_entities(prepare_collections(featured_collection))
    cb()
  }
}

async function fetch_collection_games (collection_id, cb) {
  let collection = get_entities('collections')[collection_id]
  if (!collection) {
    log(opts, `collection not found: ${collection_id}`)
    return
  }

  cb()

  let api = CredentialsStore.get_current_user()

  let page = 1
  let fetched = 0
  let total_items = 1
  let fetched_games = []

  while (fetched < total_items) {
    let res = await api.collection_games(collection_id, page)
    total_items = res.total_items
    fetched = res.per_page * page

    let normalized = normalize(res, {games: arrayOf(game)})
    let page_game_ids = normalized.entities.games::pluck('id')
    collection.games = collection.games::union(page_game_ids)
    fetched_games = fetched_games::union(page_game_ids)
    save_all_entities(normalized)
    cb()
    page++
  }

  // if games were removed, they'll be removed at this step
  collection.games = fetched_games
  cb()
}

async function fetch_search (query, cb) {
  let api = CredentialsStore.get_current_user()

  let response = normalize(await api.search(query), {
    games: arrayOf(game)
  })
  cb(response.entities.games || {})
}

let data = {}

function save_all_entities (response) {
  // console.log(`saving all entities: ${JSON.stringify(response, null, 2)}`)

  for (let table_name of Object.keys(response.entities)) {
    let table = data[table_name]
    if (!table) {
      table = {}
      data[table_name] = table
    }

    let entities = response.entities[table_name]
    for (let entity_id of Object.keys(entities)) {
      let entity = entities[entity_id]
      let record = table[entity_id]
      if (!record) {
        record = {}
        table[entity_id] = record
      }
      Object.assign(record, entity)
    }
  }
}

function get_entities (table) {
  let entities = data[table]
  if (!entities) {
    entities = {}
    data[table] = entities
  }

  return entities
}

module.exports = {
  fetch_dashboard_games,
  fetch_owned_keys,
  fetch_collections,
  fetch_collection_games,
  fetch_search,
  save_all_entities,
  get_entities
}
