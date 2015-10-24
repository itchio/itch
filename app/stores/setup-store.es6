
import Promise from 'bluebird'
import path from 'path'

import ibrew from '../util/ibrew'
import {Logger} from '../util/log'

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

let path_done = false

function augment_path () {
  let bin_path = ibrew.bin_path()
  if (!path_done) {
    path_done = true
    process.env.PATH = `${bin_path}${path.delimiter}` + process.env.PATH
  }
  return bin_path
}

function run () {
  augment_path()

  let opts = {
    logger: new Logger(),
    onstatus: AppActions.setup_status
  }

  Promise.resolve(['7za', 'butler'])
    .each(formula => {
      return ibrew.fetch(opts, formula)
    })
    .then(() => {
      AppActions.setup_done()
    })
    .catch(err => {
      AppActions.setup_status(err.stack || err, 'error')
    })
}

let SetupStore = Object.assign(new Store('setup-store'), {
  // muffin
})

AppDispatcher.register('setup-store', Store.action_listeners(on => {
  on(AppConstants.WINDOW_READY, run)
}))

export default SetupStore
