import test from 'zopf'

test('noop does nothing', t => {
  require('../app/util/noop')()
})
