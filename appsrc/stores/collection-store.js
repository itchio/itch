
import {each} from 'underline'

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import env from '../env'
import market from '../util/market'
import fetch from '../util/fetch'

const state = {
  collections: {},
  featured_ids: [
    // 37741, // Early 2016 picks
    32705, // Bite-sized gems
    22615,  // SirTapTap's cool weird games
    11, // Leaf's cool stuff
    46704 // Tools & stuff
  ]
}

const collections_seen = {}
if (process.env.NO_TEACHING || env.name === 'development') {
  state.featured_ids.length = 0
}

const CollectionStore = Object.assign(new Store('collection-store'), {
  get_state: () => state
})

function fetch_collections () {
  fetch.collections(market, state.featured_ids, commit_collections)
}

function commit_collections () {
  state.collections = market.get_entities('collections')
  state.collections::each((c, id) => {
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
    state.collections = {}
    CollectionStore.emit_change()
  })
  on(AppConstants.READY_TO_ROLL, fetch_collections)
  on(AppConstants.FETCH_COLLECTIONS, fetch_collections)
}))

export default CollectionStore
