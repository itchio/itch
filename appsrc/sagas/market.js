
import {takeEvery} from 'redux-saga'
import {take, race, fork, call} from 'redux-saga/effects'

import createQueue from './queue'
import pathmaker from '../util/pathmaker'

import {
  userDbReady,
  userDbCommit,
  userDbClosed,

  globalDbReady,
  globalDbCommit,
  globalDbClosed
} from '../actions'

import {
  LOGIN_SUCCEEDED,
  BOOT,
  USER_DB_CLOSED,
  GLOBAL_DB_CLOSED,
  LOGOUT
} from '../constants/action-types'

import Market from '../util/market'

let userMarket = null

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
    throw new Error('called getUserMarket before market initialization')
  }
  return globalMarket
}

export function * _boot (action) {
  const queue = createQueue('global-market')

  globalMarket = new Market()

  globalMarket.on('ready', () => {
    queue.dispatch(globalDbReady())
  })
  globalMarket.on('commit', (payload) => {
    queue.dispatch(globalDbCommit(payload))
  })
  globalMarket.on('close', () => {
    queue.dispatch(globalDbClosed())
  })

  const dbPath = pathmaker.globalDbPath()
  yield fork([globalMarket, globalMarket.load], dbPath)

  yield race({
    task: call(queue.exhaust, {endType: GLOBAL_DB_CLOSED}),
    cancel: take(LOGOUT)
  })
}

export function * _loginSucceeded (action) {
  const queue = createQueue('user-market')

  const {me} = action.payload
  userMarket = new Market()

  userMarket.on('ready', () => {
    queue.dispatch(userDbReady())
  })
  userMarket.on('commit', (payload) => {
    queue.dispatch(userDbCommit(payload))
  })
  userMarket.on('close', () => {
    queue.dispatch(userDbClosed())
  })

  const dbPath = pathmaker.userDbPath(me.id)
  yield fork([userMarket, userMarket.load], dbPath)

  yield race({
    task: call(queue.exhaust, {endType: USER_DB_CLOSED}),
    cancel: take(LOGOUT)
  })
}

export function * _logout (action) {
  console.log(`closing user market`)
  userMarket.close()
  userMarket = null
}

export default function * marketSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeEvery(LOGOUT, _logout)
  ]
}
