
import path from 'path'
import ifs from '../localizer/ifs'
import invariant from 'invariant'

import needle from '../promised/needle'
import urls from '../constants/urls'
import {app} from '../electron'
import env from '../env'

import delay from '../reactors/delay'

const upgradesEnabled = (env.name === 'production') || (process.env.DID_I_STUTTER === '1')

const remoteDir = path.join(app.getPath('userData'), 'locales')
const localesDir = path.resolve(path.join(__dirname, '..', 'static', 'locales'))
const localesConfigPath = path.resolve(path.join(localesDir, '..', 'locales.json'))

import logger from '../logger'
import mklog from '../util/log'
const log = mklog('locales')
const opts = {logger}

import * as actions from '../actions'

function canonicalFileName (lang) {
  return path.join(localesDir, lang + '.json')
}

function remoteFileName (lang) {
  return path.join(remoteDir, lang + '.json')
}

async function doDownloadLocale (lang, resources) {
  const local = canonicalFileName(lang)
  if (!(await ifs.exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2)
  }

  const remote = remoteFileName(lang)
  const uri = `${urls.remoteLocalePath}/${lang}.json`

  log(opts, `Downloading fresh locale file from ${uri}`)
  const resp = await needle.requestAsync('GET', uri, {format: 'json'})

  log(opts, `HTTP GET ${uri}: ${resp.statusCode}`)
  if (resp.statusCode !== 200) {
    throw new Error('Locale update server is down, try again later')
  }

  Object.assign(resources, resp.body)

  log(opts, `Saving fresh ${lang} locale to ${remote}`)
  const payload = JSON.stringify(resources, null, 2)
  await ifs.writeFile(remote, payload)
}

async function boot (store) {
  // load initial locales
  const configPayload = await ifs.readFile(localesConfigPath)
  const config = JSON.parse(configPayload)
  store.dispatch(actions.localesConfigLoaded(config))

  await loadLocale(store, 'en')
}

async function queueLocaleDownload (store, action) {
  let {lang} = action.payload

  if (!upgradesEnabled) {
    log(opts, 'Not downloading locales in development, export DID_I_STUTTER=1 to override')
    return
  }

  const downloading = store.getState().i18n.downloading
  if (downloading[lang]) {
    return
  }

  store.dispatch(actions.localeDownloadStarted({lang}))

  log(opts, `Waiting a bit before downloading ${lang} locale...`)
  await delay(5000)

  const resources = {}
  try {
    await doDownloadLocale(lang, resources)
  } catch (e) {
    store.dispatch(actions.queueHistoryItem({
      label: ['i18n.failed_downloading_locales', {lang}],
      detail: e.stack || e
    }))
  } finally {
    store.dispatch(actions.localeDownloadEnded({lang, resources}))
  }
}

async function loadLocale (store, lang) {
  invariant(typeof store === 'object', 'loadLocale needs a store')
  invariant(typeof lang === 'string', 'loadLocale needs a lang string')

  const local = canonicalFileName(lang)
  if (!(await ifs.exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2)
  }

  try {
    const payload = await ifs.readFile(local)
    const resources = JSON.parse(payload)
    store.dispatch(actions.localeDownloadEnded({lang, resources}))
  } catch (e) {
    log(opts, `Failed to load locale from ${local}: ${e.stack}`)
  }

  const remote = remoteFileName(lang)
  try {
    let payload
    try {
      payload = await ifs.readFile(remote)
    } catch (e) {
      // no updated version of the locale available
    }

    if (payload) {
      const resources = JSON.parse(payload)
      store.dispatch(actions.localeDownloadEnded({lang, resources}))
    }
  } catch (e) {
    log(opts, `Failed to load locale from ${local}: ${e.stack}`)
  }

  store.dispatch(actions.queueLocaleDownload({lang}))
}

async function languageChanged (store, action) {
  const lang = action.payload
  invariant(typeof lang === 'string', 'language must be a string')

  await loadLocale(store, lang)
}

export default {boot, queueLocaleDownload, languageChanged}
