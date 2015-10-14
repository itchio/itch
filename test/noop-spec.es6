import test from 'zopf'
import noop from '../app/util/noop'

test('noop', t => {
  noop()
  t.pass('does nothing')
})
