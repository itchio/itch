
import path from 'path'
import {app} from '../electron'

import invariant from 'invariant'

export function globalDbPath () {
  return path.join(app.getPath('userData'), 'marketdb')
}

export function userDbPath (userId) {
  invariant(userId, 'valid user id')
  return path.join(app.getPath('userData'), 'users', '' + userId, 'marketdb')
}

export default {globalDbPath, userDbPath}
