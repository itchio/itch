
import invariant from 'invariant'

import {omit} from 'underline'
import {handleActions} from 'redux-actions'

const initialState = {
  lang: 'en',
  strings: {
    en: {}
  },
  downloading: {},
  queued: {},
  locales: {}
}

export default handleActions({
  LOCALES_CONFIG_LOADED: (state, action) => {
    const config = action.payload
    return {...state, ...config}
  },

  QUEUE_LOCALE_UPDATE: (state, action) => {
    const {lang} = action.payload
    const queued = {...state.queued, [lang]: true}
    return {...state, queued}
  },

  LOCALE_DOWNLOAD_STARTED: (state, action) => {
    const {lang} = action.payload
    const queued = state.queued::omit(lang)
    const downloading = {...state.downloading, [lang]: true}
    return {...state, queued, downloading}
  },

  LOCALE_DOWNLOAD_ENDED: (state, action) => {
    const {lang, resources} = action.payload
    const oldResources = state.strings[lang] || {}

    const strings = {...state.strings, [lang]: {...oldResources, ...resources}}
    const downloading = state.downloading::omit(lang)
    return {...state, strings, downloading}
  },

  LANGUAGE_CHANGED: (state, action) => {
    const lang = action.payload
    invariant(typeof lang === 'string', 'language must be a string')

    return {...state, lang}
  }
}, initialState)
