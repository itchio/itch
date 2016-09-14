
import invariant from 'invariant'

import client from '../util/api'
import mklog from '../util/log'
const log = mklog('tasks/find-upgrade-path')

import {each} from 'underline'

export default async function start (out, opts) {
  const {credentials, market, upload, downloadKey, gameId, currentBuildId} = opts
  invariant(typeof gameId === 'number', 'find-upgrade-path has gameId')
  invariant(typeof market === 'object', 'find-upgrade-path has market')
  invariant(typeof upload === 'object', 'find-upgrade-path has upload')
  invariant(currentBuildId, 'find-upgrade-path has currentBuildId')

  invariant(credentials && credentials.key, 'find-upgrade-path has valid key')
  const api = client.withKey(credentials.key)

  if (downloadKey) {
    log(opts, 'bought game, using download key')
  } else {
    log(opts, 'no download key, seeking free/own uploads')
  }
  const response = await api.findUpgrade(downloadKey, upload.id, currentBuildId)

  let upgradePath = response.upgradePath

  // current build is the 1st element of the upgrade path
  upgradePath.shift()

  log(opts, `Got upgrade path: ${JSON.stringify(upgradePath, 0, 2)}`)

  let totalSize = 0
  upgradePath::each((entry) => {
    totalSize += entry.patchSize
  })

  return {upgradePath, totalSize}
}
