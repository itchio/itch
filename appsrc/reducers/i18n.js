
import {omit} from 'underline'
import {handleActions} from 'redux-actions'

const initialState = {
  strings: {
    en: {}
  },
  downloading: {},
  queued: {}
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
    const langStrings = {...(state.strings || {}), ...resources}
    const strings = {...state.strings, [lang]: langStrings}
    const downloading = state.downloading::omit(lang)
    return {...state, strings, downloading}
  },

  LOCALE_LOADED: (state, action) => {

  }
}, initialState)
