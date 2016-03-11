
import Promise from 'bluebird'
import path from 'path'
import {partial} from 'underline'

import ibrew from '../util/ibrew'
import xdg_mime from '../util/xdg-mime'
import {Logger} from '../util/log'
import mklog from '../util/log'
const log = mklog('setup-store')

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

let path_done = false
let ready = false

function augmentPath () {
  let binPath = ibrew.binPath()
  if (!path_done) {
    path_done = true
    process.env.PATH = `${binPath}${path.delimiter}` + process.env.PATH
  }
  return binPath
}

async function install_deps (opts) {
  let fetch = ibrew.fetch::partial(opts)

  // 7-zip is a simple binary
  await fetch('7za')

  // these are .7z archives
  let compressed = ['butler', 'elevate', 'file'].map(fetch)

  await Promise.all(compressed)
}

async function run () {
  augmentPath()

  const opts = {
    logger: new Logger(),
    onStatus: AppActions.setup_status
  }

  try {
    await xdg_mime.register_if_needed(opts)
    await install_deps(opts)

    ready = true
    AppActions.setup_done()
  } catch (err) {
    log(opts, `Setup failed: ${err.stack || err}`)

    // only unrecoverable errors should get here
    AppActions.setup_status('login.status.setup_failure', 'error', {error: err.stack || err})
  }
}

let SetupStore = Object.assign(new Store('setup-store'), {
  is_ready: () => ready
})

AppDispatcher.register('setup-store', Store.action_listeners(on => {
  on(AppConstants.WINDOW_READY, run)
}))

export default SetupStore
