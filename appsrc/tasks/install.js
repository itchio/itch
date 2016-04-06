
import invariant from 'invariant'
import uuid from 'node-uuid'

import {Transition} from './errors'

import pathmaker from '../util/pathmaker'
import sf from '../util/sf'
import mklog from '../util/log'
const log = mklog('tasks/install')

import core from './install/core'

function defaultInstallLocation () {
  const {defaultInstallLocation} = require('../store').default.getState().preferences
  return defaultInstallLocation
}

export default async function start (out, opts) {
  invariant(opts.globalMarket, 'install must have a globalMarket')
  invariant(opts.market, 'install must have a market')
  invariant(opts.archivePath, 'install must have a archivePath')
  invariant(opts.game, 'install must have a game')
  invariant(opts.upload, 'install must have an upload')
  const {market, globalMarket, archivePath, downloadKey, game, upload, installLocation = defaultInstallLocation()} = opts

  let checkTimestamps = true

  if (opts.reinstall) {
    checkTimestamps = false
  }

  let {cave} = opts

  if (!cave) {
    invariant(!opts.reinstall, 'need a cave for reinstall')

    // TODO: handle installFolder conflicts
    const installFolder = game.title

    cave = {
      id: uuid.v4(),
      gameId: game.id,
      game,
      uploadId: upload.id,
      uploads: {[upload.id]: upload},
      installLocation,
      installFolder,
      downloadKey
    }
    globalMarket.saveEntity('caves', cave.id, cave)
  }

  market.saveEntity('games', game.id, game)

  let destPath = pathmaker.appPath(cave)

  let archiveStat
  try {
    archiveStat = await sf.lstat(archivePath)
  } catch (e) {
    log(opts, `where did our archive go? re-downloading...`)
    throw new Transition({to: 'download', reason: 'missing-download'})
  }

  let imtime = cave.installedArchiveMtime
  let amtime = archiveStat.mtime
  log(opts, `comparing mtimes, installed = ${imtime}, archive = ${amtime}`)

  if (checkTimestamps && imtime && !(amtime > imtime)) {
    log(opts, `archive isn't more recent, nothing to install`)
    throw new Transition({to: 'idle', reason: 'up-to-date'})
  }

  let coreOpts = {
    ...opts,
    cave,
    destPath,
    onProgress: (info) => out.emit('progress', info.percent / 100)
  }

  globalMarket.saveEntity('caves', cave.id, {launchable: false})
  await core.install(out, coreOpts)
  globalMarket.saveEntity('caves', cave.id, {launchable: true, installedArchiveMtime: amtime, uploadId: upload.id, uploads: {[upload.id]: upload}})

  return {caveId: cave.id}
}
