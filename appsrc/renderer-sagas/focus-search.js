
import {takeEvery} from '../sagas/effects'

import {
  FOCUS_SEARCH,
  TRIGGER_LOCATION,
  TRIGGER_BACK
} from '../constants/action-types'

export function * _focusSearch () {
  const searchBar = document.querySelector('#search')
  if (searchBar) {
    searchBar.focus()
    searchBar.select()
  }
}

export function * _triggerLocation () {
  const locationBar = document.querySelector('.hub-meat-tab.visible .browser-address')
  if (locationBar) {
    if (locationBar.tagName === 'INPUT') {
      locationBar.focus()
      locationBar.select()
    } else {
      locationBar.click()
    }
  }
}

export function * _triggerBack () {
  const searchBar = document.querySelector('#search')
  if (searchBar) {
    searchBar.blur()
  }

  const locationBar = document.querySelector('.hub-meat-tab.visible .browser-address')
  if (locationBar) {
    locationBar.blur()
  }
}

export default function * focusSearchSaga () {
  yield [
    takeEvery(FOCUS_SEARCH, _focusSearch),
    takeEvery(TRIGGER_LOCATION, _triggerLocation),
    takeEvery(TRIGGER_BACK, _triggerBack)
  ]
}
