
import path from 'path'
import ifs from '../localizer/ifs'

import needle from '../promised/needle'
import urls from '../constants/urls'
import {app} from '../electron'
import env from '../env'

import {takeEvery} from 'redux-saga'
import {call, put, select} from 'redux-saga/effects'

import mkcooldown from '../util/cooldown'
const cooldown = mkcooldown(1000)

const upgradesEnabled = (env.name === 'production') || (process.env.DID_I_STUTTER === '1')

const remoteDir = path.join(app.getPath('userData'), 'locales')
const localesDir = path.resolve(path.join(__dirname, '..', 'static', 'locales'))
const localesConfigPath = path.resolve(path.join(localesDir, '..', 'locales.json'))

import logger from '../logger'
import mklog from '../util/log'
const log = mklog('locales')
const opts = {logger}

import {operationFailed, localesConfigLoaded, queueLocaleDownload, localeDownloadStarted, localeDownloadEnded} from '../actions'
import {BOOT, QUEUE_LOCALE_DOWNLOAD} from '../constants/action-types'

export function canonicalFileName (lang) {
  return path.join(localesDir, lang + '.json')
}

export function remoteFileName (lang) {
  return path.join(remoteDir, lang + '.json')
}

export function * doDownloadLocale (lang, resources) {
  const local = canonicalFileName(lang)
  if (!(yield call(ifs.exists, local))) {
    // try stripping region
    lang = lang.substring(0, 2)
  }

  const remote = remoteFileName(lang)
  const uri = `${urls.remoteLocalePath}/${lang}.json`

  log(opts, `Downloading fresh locale file from ${uri}`)
  const resp = yield call(needle.requestAsync, 'GET', uri, {format: 'json'})

  log(opts, `HTTP GET ${uri}: ${resp.statusCode}`)
  if (resp.statusCode !== 200) {
    throw new Error(`Locale update server is down, try again later`)
  }

  Object.assign(resources, resp.body)

  log(opts, `Saving fresh ${lang} locale to ${remote}`)
  const payload = JSON.stringify(resources, null, 2)
  yield call(ifs.writeFile, remote, payload)
}

export function * loadInitialLocales () {
  const configPayload = yield call(ifs.readFile, localesConfigPath)
  const config = JSON.parse(configPayload)
  yield put(localesConfigLoaded(config))

  yield* loadLocale('en')
}

export function * downloadLocale (action) {
  let {lang} = action.payload

  if (!upgradesEnabled) {
    log(opts, `Not downloading locales in development, export DID_I_STUTTER=1 to override`)
    return
  }

  const downloading = yield select((state) => state.i18n.downloading)
  if (downloading[lang]) {
    return
  }

  yield put(localeDownloadStarted({lang}))

  log(opts, `Waiting a bit before downloading ${lang} locale...`)
  yield call(cooldown)

  const resources = {}
  try {
    yield* doDownloadLocale(lang, resources)
  } catch (e) {
    yield put(operationFailed({type: 'locale_download', data: {lang}, stack: e.stack}))
  } finally {
    yield put(localeDownloadEnded({lang, resources}))
  }
}

export function * loadLocale (lang) {
  const local = canonicalFileName(lang)
  if (!(yield call(ifs.exists, local))) {
    // try stripping region
    lang = lang.substring(0, 2)
  }

  try {
    const payload = yield call(ifs.readFile, local)
    const resources = JSON.parse(payload)
    yield put(localeDownloadEnded({lang, resources}))
  } catch (e) {
    log(opts, `Failed to load locale from ${local}: ${e.stack}`)
  }

  const remote = remoteFileName(lang)
  try {
    let payload
    try {
      payload = yield call(ifs.readFile, remote)
    } catch (e) {
      // no updated version of the locale available
    }

    if (payload) {
      const resources = JSON.parse(payload)
      yield put(localeDownloadEnded({lang, resources}))
    }
  } catch (e) {
    log(opts, `Failed to load locale from ${local}: ${e.stack}`)
  }

  yield put(queueLocaleDownload(lang))
}

export default function * localesSaga () {
  yield [
    takeEvery(BOOT, loadInitialLocales),
    takeEvery(QUEUE_LOCALE_DOWNLOAD, downloadLocale)
  ]
}
