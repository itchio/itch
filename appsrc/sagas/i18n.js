
import createQueue from './queue'
import {createSelector} from 'reselect'

import {takeEvery} from 'redux-saga'
import {call, select} from 'redux-saga/effects'

import {languageChanged} from '../actions'

export default function * i18nSaga () {
  const queue = createQueue('i18n')
  const i18nSelector = createSelector(
    (state) => state.system.lang,
    (state) => state.session.preferences.lang,
    (systemLang, prefLang) => {
      queue.dispatch(languageChanged(prefLang || systemLang || 'en'))
    }
  )

  yield [
    takeEvery('*', function * watchI18n () {
      i18nSelector(yield select())
    }),
    call(queue.exhaust)
  ]
}
