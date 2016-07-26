
import path from 'path'
import {app} from '../electron'

import invariant from 'invariant'

const APPDATA_RE = /^appdata\/(.*)$/

export function appPath (cave) {
  // < 0.13.x, installFolder isn't set, it's implicitly the cave's id
  const {installLocation, installFolder = cave.id} = cave

  invariant(typeof installLocation === 'string', 'valid install location name')
  invariant(typeof installFolder === 'string', 'valid install folder')

  const matches = APPDATA_RE.exec(installLocation)
  if (matches) {
    // caves migrated from 0.13.x or earlier: installed in per-user directory
    return path.join(app.getPath('userData'), 'users', matches[1], 'apps', installFolder)
  } else if (installLocation === 'appdata') {
    // caves >= 0.14.x with no special install location specified
    return path.join(app.getPath('userData'), 'apps', installFolder)
  } else {
    const store = require('../store').default
    const locations = store.getState().preferences.installLocations
    const location = locations[installLocation]
    invariant(location, 'install location exists')
    return path.join(location.path, 'apps', installFolder)
  }
}

export function downloadPath (upload) {
  invariant(typeof upload === 'object', 'valid upload')
  invariant(upload.id, 'upload has id')
  invariant(typeof upload.filename === 'string', 'upload has filename')
  const ext = /\.[^\.]+$/.exec(upload.filename) || ''
  let slug = upload.id
  if (upload.buildId) {
    slug = `${slug}-${upload.buildId}`
  }
  return path.join(app.getPath('userData'), 'downloads', '' + slug + ext)
}

export function globalDbPath () {
  return path.join(app.getPath('userData'), 'marketdb')
}

export function preferencesPath () {
  return path.join(app.getPath('userData'), 'preferences.json')
}

export function logPath () {
  return path.join(app.getPath('userData'), 'logs', 'itch.txt')
}

export function updaterLogPath () {
  return path.join(app.getPath('userData'), 'logs', 'itch.updater.txt')
}

export function caveLogPath (caveId) {
  return path.join(app.getPath('userData'), 'cave-logs', 'cave-' + caveId + '.txt')
}

export function userDbPath (userId) {
  invariant(userId, 'valid user id')
  return path.join(app.getPath('userData'), 'users', '' + userId, 'marketdb')
}

export function sanitize (file) {
  const sane = file.replace(/[^a-zA-Z0-9_. -]/g, '').replace(/[\s]+/, ' ')
  if (sane.length > 0) {
    return sane
  } else {
    return 'nihilo'
  }
}

export default {appPath, downloadPath, globalDbPath, userDbPath, sanitize,
  preferencesPath, logPath, updaterLogPath, caveLogPath}
