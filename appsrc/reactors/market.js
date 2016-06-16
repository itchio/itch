
import createQueue from './queue'
import pathmaker from '../util/pathmaker'

import * as actions from '../actions'

import Market from '../util/market'

let userMarket = null

import mklog from '../util/log'
import {opts} from '../logger'
const log = mklog('navigation')

// abstraction leak but helps halving the bandwidth between browser and renderer:
// the reducer can just pick data from here instead of getting it from the message,
// which would also be serialized & sent by JSON
export function getUserMarket () {
  if (!userMarket) {
    throw new Error('called getUserMarket before market initialization')
  }
  return userMarket
}

let globalMarket = null

export function getGlobalMarket () {
  if (!globalMarket) {
    throw new Error('called getGlobalMarket before market initialization')
  }
  return globalMarket
}

async function boot (store, action) {
  globalMarket.on('ready', () => {
    store.dispatch(actions.globalDbReady())
  })

  globalMarket.on('commit', (payload) => {
    store.dispatch(actions.globalDbCommit(payload))
  })

  await globalMarket.load(pathmaker.globalDbPath())
}

async function loginSucceeded (store, action) {
  const queue = createQueue(store, 'user-market')

  const {me} = action.payload
  userMarket = new Market()

  userMarket.on('ready', () => {
    log(opts, 'got user db ready')
    queue.dispatch(actions.userDbReady())
  })

  userMarket.on('commit', (payload) => {
    queue.dispatch(actions.userDbCommit(payload))
  })

  userMarket.on('close', () => {
    log(opts, 'got user db close')
    queue.close()
    store.dispatch(actions.userDbClosed())
  })

  queue.exhaust()

  await userMarket.load(pathmaker.userDbPath(me.id))
}

async function logout (action) {
  if (userMarket) {
    log(opts, 'closing user db')
    userMarket.close()
    userMarket = null
  } else {
    log(opts, 'no user db to close')
  }
}

export default {boot, loginSucceeded, logout}
