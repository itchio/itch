
import { each } from 'underline'

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import market from '../util/market'
import fetch from '../util/fetch'

let state = {}

let CollectionStore = Object.assign(new Store('collection-store'), {
  get_state: () => state
})

let collections_seen = {}
let featured_ids = [
  37741, // Early 2016 picks
  32705  // Bite-sized gems
]
if (process.env.NO_TEACHING) {
  featured_ids.length = 0
}

import env from '../env'

if (env.name === 'development') {
  featured_ids.length = 0
}

function fetch_collections () {
  fetch.collections(market, featured_ids, commit_collections)
}

function commit_collections () {
  state = market.get_entities('collections')

  state::each((c, id) => {
    if (collections_seen[id]) {
      return
    }
    collections_seen[id] = true
    AppActions.fetch_games(`collections/${c.id}`)
  })
  CollectionStore.emit_change()
}

AppDispatcher.register('collection-store', Store.action_listeners(on => {
  on(AppConstants.LOGOUT, (payload) => {
    state = {}
    CollectionStore.emit_change()
  })
  on(AppConstants.READY_TO_ROLL, fetch_collections)
  on(AppConstants.FETCH_COLLECTIONS, fetch_collections)
}))

export default CollectionStore
