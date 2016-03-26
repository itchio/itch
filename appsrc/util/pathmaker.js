
import path from 'path'
import {app} from '../electron'

import invariant from 'invariant'

export function downloadPath (upload) {
  invariant(typeof upload === 'object', 'valid upload')
  invariant(upload.id, 'upload has id')
  invariant(upload.filename, 'upload has filename')
  const ext = /\..+$/.exec(upload.filename) || ''
  return path.join(app.getPath('userData'), 'downloads', '' + upload.id + ext)
}

export function globalDbPath () {
  return path.join(app.getPath('userData'), 'marketdb')
}

export function userDbPath (userId) {
  invariant(userId, 'valid user id')
  return path.join(app.getPath('userData'), 'users', '' + userId, 'marketdb')
}

export default {downloadPath, globalDbPath, userDbPath}
