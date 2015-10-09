import test from 'tape-catch'
import sinon from 'sinon'
import {contains} from 'underscore'

import os from '../../metal/util/os'

test('platform', t => {
  t.plan(1)
  t.ok(contains(['win32', 'linux', 'darwin'], os.platform()), 'is known')
})

test('itch_platform', sinon.test(function (t) {
  let mock = this.mock(os)
  t.plan(3)

  mock.expects('platform').returns('win32')
  t.equal('windows', os.itch_platform())

  mock.expects('platform').returns('linux')
  t.equal('linux', os.itch_platform())

  mock.expects('platform').returns('darwin')
  t.equal('osx', os.itch_platform())
}))

test('cli_args', t => {
  t.plan(1)
  t.equal(os.cli_args(), process.argv)
})
