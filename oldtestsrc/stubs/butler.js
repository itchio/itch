
import test from 'zopf'
const noop = async () => null

module.exports = test.module({
  dl: noop,
  untar: noop
})
