
import invariant from 'invariant'

import os from '../util/os'

import mklog from '../util/log'
const log = mklog('tasks/configure')
import pathmaker from '../util/pathmaker'
import humanize from 'humanize-plus'

import html from './configure/html'
import computeSize from './configure/compute-size'

async function configure (appPath) {
  const platform = os.platform()

  switch (platform) {
    case 'win32':
    case 'darwin':
    case 'linux':
      const configurator = require(`./configure/${platform}`).default
      return await configurator.configure(appPath)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

export default async function start (out, opts) {
  const {cave, upload, game, globalMarket} = opts
  invariant(cave, 'configure has cave')
  invariant(game, 'configure has game')
  invariant(upload, 'configure has upload')

  const appPath = pathmaker.appPath(cave)
  log(opts, `configuring ${appPath}`)

  const launchType = upload.type === 'html' ? 'html' : 'native'
  globalMarket.saveEntity('caves', cave.id, {launchType})

  if (launchType === 'html') {
    const res = await html.configure(game, appPath)
    log(opts, `html-configure yielded res: ${JSON.stringify(res, null, 2)}`)
    globalMarket.saveEntity('caves', cave.id, res)
  } else {
    const executables = (await configure(appPath)).executables
    log(opts, `native-configure yielded execs: ${JSON.stringify(executables, null, 2)}`)
    globalMarket.saveEntity('caves', cave.id, {executables})
  }

  const totalSize = await computeSize.computeFolderSize(opts, appPath)
  log(opts, `total size of ${appPath}: ${humanize.fileSize(totalSize)} (${totalSize} bytes)`)

  globalMarket.saveEntity('caves', cave.id, {installedSize: totalSize})
}
