
import Promise from 'bluebird'

let noop = () => Promise.resolve()

export default {
  install_update: noop,
  '@noCallThru': true
}
