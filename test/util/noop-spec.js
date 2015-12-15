

let test = require('zopf')
let noop = require('../../app/util/noop')

test('noop', t => {
  noop()
  t.pass('does nothing')
})
