
import ospath from 'path'
import mkdirp from 'mkdirp'

import env from '../env'
const full = (process.type !== 'renderer' && env.name !== 'test')

import pathmaker from '../util/pathmaker'
import mklog from '../util/log'

// naughty
try {
  mkdirp.sync(ospath.dirname(pathmaker.logPath()))
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.log(`While creating logs dir: ${e.stack}`)
  }
}

const loggerOpts = {
  sinks: {}
}
if (full) {
  loggerOpts.sinks.file = pathmaker.logPath()
}

export const logger = new mklog.Logger(loggerOpts)
export default logger

const log = mklog('itch')
export const opts = {logger}

if (full) {
  log(opts, `using electron ${process.versions.electron}`)
}
