
import {takeEvery} from 'redux-saga'
import {take, race, fork, put, call} from 'redux-saga/effects'

import createQueue from './queue'

import {dbReady} from '../actions'
import {LOGIN_SUCCEEDED, DB_COMMIT, DB_CLOSED, LOGOUT} from '../constants/action-types'

import Market from '../util/market'

let market = null

// abstraction leak but helps halving the bandwidth between browser and renderer:
// the reducer can just pick data from here instead of getting it from the message,
// which would also be serialized & sent by JSON
export function getEntities (tableName) {
  if (!market) {
    throw new Error('called getEntities before market initialization')
  }
  return market.getEntities(tableName)
}

export function * _dbCommit (action) {
  const {initial} = action.payload
  if (initial) {
    yield put(dbReady())
  }
}

export function * _loginSucceeded (action) {
  const queue = createQueue('market')

  const {me} = action.payload
  market = new Market((action) => {
    queue.dispatch(action)
  })

  yield fork([market, market.load], me.id)

  yield race({
    task: call(queue.exhaust, {endType: DB_CLOSED}),
    cancel: take(LOGOUT)
  })
}

export function * _logout (action) {
  console.log(`closing market for user ${market.userId}`)
  market.close()
  market = null
}

export default function * marketSaga () {
  yield [
    takeEvery(DB_COMMIT, _dbCommit),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeEvery(LOGOUT, _logout)
  ]
}
