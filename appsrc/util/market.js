
import { each } from 'underline'
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
  get_entities
}
