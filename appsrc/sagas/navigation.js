
import {takeEvery} from 'redux-saga'
import {select, put} from 'redux-saga/effects'
import {pluck} from 'underline'

import {navigate} from '../actions'
import {SHOW_PREVIOUS_TAB, SHOW_NEXT_TAB} from '../constants/action-types'

export function * applyTabOffset (offset) {
  const {path, tabs} = yield select((state) => state.session.navigation)
  const {constant, transient} = tabs

  const paths = constant::pluck('path').concat(transient::pluck('path'))
  const numPaths = paths.length

  const index = paths.indexOf(path)

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numPaths) % numPaths
  const newPath = paths[newIndex]

  yield put(navigate(newPath))
}

export function * _showPreviousTab () {
  yield* applyTabOffset(-1)
}

export function * _showNextTab () {
  yield* applyTabOffset(1)
}

export default function * navigationSaga () {
  yield [
    takeEvery(SHOW_PREVIOUS_TAB, _showPreviousTab),
    takeEvery(SHOW_NEXT_TAB, _showNextTab)
  ]
}
