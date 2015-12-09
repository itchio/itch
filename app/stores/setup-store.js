'use nodent';'use strict'

import Promise from 'bluebird'
import path from 'path'
import {partial} from 'underscore'

import ibrew from '../util/ibrew'
import {Logger} from '../util/log'

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

let path_done = false
let ready = false

function augment_path () {
  let bin_path = ibrew.bin_path()
  if (!path_done) {
    path_done = true
    process.env.PATH = `${bin_path}${path.delimiter}` + process.env.PATH
  }
  return bin_path
}

async function run () {
  augment_path()

  let opts = {
    logger: new Logger(),
    onstatus: AppActions.setup_status
  }

  let fetch = partial(ibrew.fetch, opts)

  try {
    // 7-zip is a simple binary
    await fetch('7za')

    // these are .7z archives
    let compressed = ['butler', 'elevate'].map(fetch)
    await Promise.all(compressed)

    ready = true
    AppActions.setup_done()
  } catch (err) {
    AppActions.setup_status(err.stack || err, 'error')
  }
}

let SetupStore = Object.assign(new Store('setup-store'), {
  is_ready: () => {
    return ready
  }
})

AppDispatcher.register('setup-store', Store.action_listeners(on => {
  on(AppConstants.WINDOW_READY, run)
}))

export default SetupStore
