
import path from 'path'
import ibrew from '../util/ibrew'

import {takeEvery} from './effects'
import {put, call, race} from 'redux-saga/effects'
import {map} from 'underline'

import {BOOT, RETRY_SETUP} from '../constants/action-types'
import {setupStatus, setupDone} from '../actions'

import logger from '../logger'

import createQueue from '../sagas/queue'

export function augmentPath () {
  const binPath = ibrew.binPath()
  process.env.PATH = `${binPath}${path.delimiter}${process.env.PATH}`
  return binPath
}

export function * fetch (name) {
  const queue = createQueue('setup')

  const opts = {
    logger,
    onStatus: (icon, message) => {
      queue.dispatch(setupStatus({icon, message}))
    }
  }

  yield race({
    ibrew: call(ibrew.fetch, opts, name),
    queue: call(queue.exhaust)
  })
}

export function * setup () {
  yield call(augmentPath)
  yield call(fetch, '7za')
  yield ['butler', 'elevate', 'file']::map((name) => call(fetch, name))
  yield put(setupDone())
}

export function * _boot () {
  try {
    yield call(setup)
  } catch (e) {
    const err = e.ibrew || e
    console.log('got error: ', err)
    yield put(setupStatus({icon: 'error', message: ['login.status.setup_failure', {error: (err.message || '' + err)}]}))
  }
}

export default function * setupSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(RETRY_SETUP, _boot)
  ]
}
