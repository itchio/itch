
import {createSelector} from 'reselect'

import {languageChanged} from '../actions'

const makeSelector = (store) => createSelector(
  (state) => state.system.lang,
  (state) => state.preferences.lang,
  (systemLang, prefLang) => {
    const lang = prefLang || systemLang || 'en'
    setImmediate(() => {
      store.dispatch(languageChanged(lang))
    })
  }
)
let selector

async function catchAll (store, action) {
  if (!selector) {
    selector = makeSelector(store)
  }
  selector(store.getState())
}

export default {catchAll}
