
const test = require('zopf')
const noop = require('../../app/util/noop')

test('noop', t => {
  noop()
  t.pass('does nothing')
})
