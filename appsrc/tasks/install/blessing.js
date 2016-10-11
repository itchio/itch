
import Promise from 'bluebird'

import mklog from '../../util/log'
const log = mklog('blessing')

const self = (out, opts) => {
  log(opts, 'blessing: stub, assuming yes')
  return Promise.resolve()
}

export default self
