import deep_assign from 'deep-assign'
import {indexBy} from 'underscore'

import Store from './store'
import CredentialsStore from './credentials-store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import db from '../util/db'

let state = {}

let CollectionStore = Object.assign(new Store('collection-store'), {
  get_state: () => state
})

function merge_state (obj) {
  deep_assign(state, obj)
  CollectionStore.emit_change()
}

function cache_collections () {
  db.find({_table: 'collections'})
    .then(collections => indexBy(collections, 'id'))
    .then(merge_state)
    .then(() => Object.keys(state))
    .map(cid => AppActions.fetch_games(`collections/${cid}`))
}

function authenticated () {
  cache_collections()

  let user = CredentialsStore.get_current_user()
  user.my_collections()
    .then(res => res.collections)
    .then(db.save_collections)
    .then(cache_collections)
}

AppDispatcher.register('collection-store', Store.action_listeners(on => {
  on(AppConstants.AUTHENTICATED, authenticated)
}))

export default CollectionStore
