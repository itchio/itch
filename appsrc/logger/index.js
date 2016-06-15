
import pathmaker from '../util/pathmaker'
import mklog from '../util/log'
export const logger = new mklog.Logger({
  sinks: {
    file: pathmaker.logPath()
  }
})
export default logger

const log = mklog('itch')
export const opts = {logger}
log(opts, `using electron ${process.versions.electron}`)
