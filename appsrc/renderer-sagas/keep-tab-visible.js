
import {takeEvery} from 'redux-saga'

import {TAB_CHANGED} from '../constants/action-types'

export function * _tabChanged (action) {
  const {id} = action.payload
  const item = document.querySelector(`.hub-sidebar-item[data-id='${id}']`)
  item && item.scrollIntoView()
}

export default function * keepTabVisibleSaga () {
  yield [
    takeEvery(TAB_CHANGED, _tabChanged)
  ]
}
