
import {takeEvery} from 'redux-saga'

import {TAB_CHANGED} from '../constants/action-types'

export function * _tabChanged (action) {
  const path = action.payload
  const item = document.querySelector(`.hub-sidebar-item[data-path='${path}']`)
  item && item.scrollIntoView()
}

export default function * fillUsernameOnFailureSaga () {
  yield [
    takeEvery(TAB_CHANGED, _tabChanged)
  ]
}
