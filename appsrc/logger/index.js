
import mklog from '../util/log'
export const logger = new mklog.Logger()
export default logger

const log = mklog('itch')
export const opts = {logger}
log(opts, `using electron ${process.versions.electron}`)
