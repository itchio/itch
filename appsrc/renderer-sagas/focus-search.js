
import {takeEvery} from 'redux-saga'

import {FOCUS_SEARCH} from '../constants/action-types'

export function * _focusSearch () {
  const searchBar = document.querySelector('#search')
  if (searchBar) {
    searchBar.focus()
  }
}

export default function * focusSearchSaga () {
  yield [
    takeEvery(FOCUS_SEARCH, _focusSearch)
  ]
}
