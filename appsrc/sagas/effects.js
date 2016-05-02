
import Promise from 'bluebird'

import {takeEvery as originalTakeEvery} from 'redux-saga'
import {call} from 'redux-saga/effects'

export const delay = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms))

export const takeEvery = function protectedTakeEvery (pattern, f) {
  return originalTakeEvery(pattern, function * _protectedTakeEvery (action) {
    try {
      yield call(f, action)
    } catch (err) {
      console.log(`Error in takeEvery ${JSON.stringify(pattern)}: ${err.stack || err}`)
    }
  })
}

export default {delay, takeEvery}
