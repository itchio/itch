
import {takeEvery} from 'redux-saga'
import {take, put, race, call} from 'redux-saga/effects'

import createQueue from './queue'

import {dbCommit, dbReady} from '../actions'
import {LOGIN_SUCCEEDED, DB_COMMIT, LOGOUT} from '../constants/action-types'

import Market from '../util/market'

let market = null
let hadInitial = false

// abstraction leak but helps halving the bandwidth between browser and renderer:
// the reducer can just pick data from here instead of getting it from the message,
// which would also be serialized & sent by JSON
export function getEntities (tableName) {
  if (!market || !hadInitial) {
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
  market = new Market()
  market.dispatch = ::queue.dispatch

  yield call([market, market.load], me.id)

  yield put(dbCommit({updated: market.data}))

  yield race(
    take(LOGOUT),
    call(queue.exhaust)
  )

  market.unload()
}

export function * _logout (action) {
  market.clear()
  market = null
  hadInitial = false
}

export default function * marketSaga () {
  yield [
    takeEvery(DB_COMMIT, _dbCommit),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeEvery(LOGOUT, _logout)
  ]
}
