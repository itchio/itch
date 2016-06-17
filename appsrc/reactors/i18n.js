
import {createSelector} from 'reselect'

import {languageChanged} from '../actions'

const makeSelector = (store) => createSelector(
  (state) => state.system.lang,
  (state) => state.preferences.lang,
  (systemLang, prefLang) => {
    store.dispatch(languageChanged(prefLang || systemLang || 'en'))
  }
)
let selector

export default async function i18n (store, action) {
  if (!selector) {
    selector = makeSelector(store)
  }
  selector(store.getState())
}
