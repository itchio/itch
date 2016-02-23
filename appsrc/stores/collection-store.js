
import { each } from 'underline'

let Store = require('./store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let market = require('../util/market')

let state = {}

let CollectionStore = Object.assign(new Store('collection-store'), {
  get_state: () => state
})

function merge_state (obj) {
  Object.assign(state, obj)
  CollectionStore.emit_change()
}

let collections_seen = {}
let featured_ids = [
  37741, // Early 2016 picks
  32705  // Bite-sized gems
]
if (process.env.NO_TEACHING) {
  featured_ids.length = 0
}

let env = require('../env')

if (env.name === 'development') {
  featured_ids.length = 0
}

function fetch_collections () {
  market.fetch_collections(featured_ids, commit_collections)
}

function commit_collections () {
  const collections = market.get_entities('collections')
  merge_state(collections)

  collections::each((c) => {
    if (collections_seen[c.id]) {
      return
    }
    collections_seen[c.id] = true
    AppActions.fetch_games(`collections/${c.id}`)
  })
}

function gc_database (payload) {
  // FIXME
  // db.collect_garbage(payload.used_game_ids)
}

function ready_to_roll () {
  fetch_collections()
}

AppDispatcher.register('collection-store', Store.action_listeners(on => {
  on(AppConstants.LOGOUT, (payload) => {
    state = {}
    CollectionStore.emit_change()
  })
  on(AppConstants.READY_TO_ROLL, ready_to_roll)
  on(AppConstants.FETCH_COLLECTIONS, fetch_collections)
  on(AppConstants.GC_DATABASE, gc_database)
}))

module.exports = CollectionStore
