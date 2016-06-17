
import path from 'path'
import ibrew from '../util/ibrew'

import {map} from 'underline'

import * as actions from '../actions'

import logger from '../logger'

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
  augmentPath()
  await fetch(store, '7za')
  await Promise.all(['butler', 'elevate', 'activate', 'firejail', 'file']::map((name) => fetch(store, name)))
  store.dispatch(actions.setupDone())
}

async function boot (store, action) {
  try {
    await setup(store)
  } catch (e) {
    const err = e.ibrew || e
    console.log('got error: ', err)
    store.dispatch(actions.setupStatus({icon: 'error', message: ['login.status.setup_failure', {error: (err.message || '' + err)}]}))
  }
}

const retrySetup = boot

export default {boot, retrySetup}
