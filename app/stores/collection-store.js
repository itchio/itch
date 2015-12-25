

let indexBy = require('underscore').indexBy

let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let db = require('../util/db')

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
  32029, // LD34 staff picks
  32705  // Bite-sized gems
]
if (process.env.NO_TEACHING) {
  featured_ids.length = 0
}

let env = require('../env')

if (env.name === 'development') {
  featured_ids.length = 0
}

async function fetch_collections () {
  let user = CredentialsStore.get_current_user()
  if (!user) return

  let old_collections = await db.find({_table: 'collections'})
  let old_collections_by_id = indexBy(old_collections, 'id')
  merge_state(old_collections_by_id)

  let collections = (await user.my_collections()).collections

  for (let featured_id of featured_ids) {
    try {
      let fc = (await user.collection(featured_id)).collection
      fc._featured = true
      collections.push(fc)
    } catch (e) {
      // don't let that stop us now, we're having such a good time.
      console.log(`Could not fetch featured collection ${featured_id}: ${e.stack || e}`)
    }
  }

  let collections_by_id = indexBy(collections, 'id')
  await db.save_collections(collections)
  merge_state(collections_by_id)

  for (let coll of collections) {
    if (collections_seen[coll.id]) {
      continue
    }
    collections_seen[coll.id] = true
    AppActions.fetch_games(`collections/${coll.id}`)
  }

  for (let coll of old_collections) {
    if (!collections_by_id[coll.id]) {
      db.remove({_table: 'collections', id: coll.id})
    }
  }
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
}))

module.exports = CollectionStore
