import test from 'zopf'
import Promise from 'bluebird'

import defer from '../app/util/defer'

test('defer eventually calls', t => {
  return new Promise((resolve, reject) => {
    let spy = t.spy()
    defer(spy)
    setTimeout(() => {
      t.ok(spy.calledOnce)
      resolve()
    }, 10)
  })
})
