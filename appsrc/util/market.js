
import { each, pluck } from 'underline'
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
    save_all_entities(normalize(await api.my_owned_keys(), {
      owned_keys: arrayOf(download_key)
    }))
    cb()
    running = response.owned_keys.length > 0
  }

  cb()
}

async function fetch_collections (featured_ids, cb) {
  cb()

  let api = CredentialsStore.get_current_user()
  if (!api) return

  let my_collections_res = await api.my_collections()
  let my_collections = normalize(my_collections_res, {
    collections: arrayOf(collection)
  })
  ;(my_collections.entities.collections || [])::each((c) => c._featured = false)
  save_all_entities(my_collections)
  cb()

  for (let featured_id of featured_ids) {
    let featured_collection_res = await api.collection(featured_id)
    let featured_collection = normalize(featured_collection_res, {
      collection: collection
    })
    ;(featured_collection.entities.collections || [])::each((c) => c._featured = true)
    save_all_entities(featured_collection)
    cb()
  }
}

async function fetch_collection_games (collection_id, cb) {
  cb()

  let api = CredentialsStore.get_current_user()

  let page = 1
  let fetched = 0
  let total_items = 1
  let game_ids = []

  while (fetched < total_items) {
    let res = await api.collection_games(collection_id, page)
    total_items = res.total_items
    fetched = res.per_page * page

    let normalized = normalize(res, {games: arrayOf(game)})
    game_ids = game_ids.concat(normalized.entities.games::pluck('id'))
    save_all_entities(normalized)
    cb()
    page++
  }
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
  return data[table] || {}
}

module.exports = {
  fetch_dashboard_games,
  fetch_owned_keys,
  fetch_collections,
  fetch_collection_games,
  get_entities
}
