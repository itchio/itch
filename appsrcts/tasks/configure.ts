
import * as invariant from 'invariant'

import os from '../util/os'

import mklog from '../util/log'
const log = mklog('tasks/configure')
import pathmaker from '../util/pathmaker'
import * as humanize from 'humanize-plus'

import html from './configure/html'
import computeSize from './configure/compute-size'

import { ConfigureResult } from './configure/common'
import { CaveRecord, GameRecord, UploadRecord, IMarket } from '../types/db'
import { EventEmitter } from 'events'

async function configure(appPath: string): Promise<ConfigureResult> {
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

interface ConfigureOpts {
  cave: CaveRecord
  game: GameRecord
  upload: UploadRecord
  globalMarket: IMarket
}

export default async function start(out: EventEmitter, opts: ConfigureOpts) {
  const {cave, upload, game, globalMarket} = opts
  invariant(cave, 'configure has cave')
  invariant(game, 'configure has game')
  invariant(upload, 'configure has upload')

  const appPath = pathmaker.appPath(cave)
  log(opts, `configuring ${appPath}`)

  const launchType = upload.type === 'html' ? 'html' : 'native'
  globalMarket.saveEntity('caves', cave.id, { launchType })

  if (launchType === 'html') {
    const res = await html.configure(game, appPath)
    log(opts, `html-configure yielded res: ${JSON.stringify(res, null, 2)}`)
    globalMarket.saveEntity('caves', cave.id, res)
  } else {
    const executables = (await configure(appPath)).executables
    log(opts, `native-configure yielded execs: ${JSON.stringify(executables, null, 2)}`)
    globalMarket.saveEntity('caves', cave.id, { executables })
  }

  const totalSize = await computeSize.computeFolderSize(opts, appPath)
  log(opts, `total size of ${appPath}: ${humanize.fileSize(totalSize)} (${totalSize} bytes)`)

  globalMarket.saveEntity('caves', cave.id, { installedSize: totalSize })
}
