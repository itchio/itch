import test from 'zopf'
import {contains} from 'underscore'

import os from '../app/util/os'

test('platform', t => {
  t.ok(contains(['win32', 'linux', 'darwin'], os.platform()), 'is known')
})

// serial because mocking 'os' export
test.serial('itch_platform', t => {
  let mock = t.mock(os)

  mock.expects('platform').returns('win32')
  t.is('windows', os.itch_platform())

  mock.expects('platform').returns('linux')
  t.is('linux', os.itch_platform())

  mock.expects('platform').returns('darwin')
  t.is('osx', os.itch_platform())
})

test('cli_args', t => {
  t.is(os.cli_args(), process.argv)
})
