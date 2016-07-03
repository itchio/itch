
import pathmaker from '../util/pathmaker'
import mklog from '../util/log'
const loggerOpts = {
  sinks: {}
}
if (process.type !== 'renderer') {
  loggerOpts.sinks.file = pathmaker.logPath()
}
export const logger = new mklog.Logger(loggerOpts)
export default logger

const log = mklog('itch')
export const opts = {logger}
log(opts, `using electron ${process.versions.electron}`)
