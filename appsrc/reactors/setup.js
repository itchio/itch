
import path from 'path'
import ibrew from '../util/ibrew'

import {map} from 'underline'

import * as actions from '../actions'

import mklog from '../util/log'
const log = mklog('reactors/setup')
import logger, {opts} from '../logger'

function augmentPath () {
  const binPath = ibrew.binPath()
  process.env.PATH = `${binPath}${path.delimiter}${process.env.PATH}`
  return binPath
}

async function fetch (store, name) {
  const opts = {
    logger,
    onStatus: (icon, message) => {
      store.dispatch(actions.setupStatus({icon, message}))
    }
  }

  await ibrew.fetch(opts, name)
}

async function setup (store) {
  log(opts, 'setup starting')
  augmentPath()
  await fetch(store, '7za')
  log(opts, '7za done')
  await Promise.all(['butler', 'elevate', 'activate', 'firejail', 'file']::map((name) => fetch(store, name)))
  log(opts, 'all deps done')
  store.dispatch(actions.setupDone())
}

async function boot (store, action) {
  try {
    await setup(store)
  } catch (e) {
    const err = e.ibrew || e
    log(opts, 'setup got error: ', err)
    store.dispatch(actions.setupStatus({icon: 'error', message: ['login.status.setup_failure', {error: (err.message || '' + err)}]}))
  }
}

async function retrySetup (store, action) {
  await boot(store, action)
}

export default {boot, retrySetup}
