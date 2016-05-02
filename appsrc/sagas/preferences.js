
import {takeEvery} from './effects'
import {put, select, call} from 'redux-saga/effects'

import pathmaker from '../util/pathmaker'
import {camelifyObject} from '../util/format'
import fs from 'fs'
import sf from '../util/sf'

import * as actions from '../actions'
import {BOOT, UPDATE_PREFERENCES} from '../constants/action-types'

import mklog from '../util/log'
const log = mklog('preferences')
import {opts} from '../logger'

export function * _boot () {
  // XXX: sync I/O is bad but we can live with it for now.
  const prefs = camelifyObject(JSON.parse(fs.readFileSync(pathmaker.preferencesPath())))

  log(opts, 'imported preferences: ', JSON.stringify(prefs, null, 2))
  yield put(actions.updatePreferences(prefs))
}

let _atomicInvocations = 0

export function * _updatePreferences () {
  const prefs = yield select((state) => state.preferences)

  // write prefs atomically
  const file = pathmaker.preferencesPath()
  const tmpPath = file + '.tmp' + (_atomicInvocations++)
  yield call(sf.writeFile, tmpPath, JSON.stringify(prefs))
  yield call(sf.rename, tmpPath, file)
  log(opts, `preferences saved (${_atomicInvocations})`)
}

export default function * preferencesSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(UPDATE_PREFERENCES, _updatePreferences)
  ]
}
