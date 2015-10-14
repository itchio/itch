import test from 'zopf'
import {contains} from 'underscore'

import os from '../app/util/os'

test('os', t => {
  let mock = t.mock(os)

  t.ok(contains(['win32', 'linux', 'darwin'], os.platform()), 'is known')

  mock.expects('platform').returns('win32')
  t.is('windows', os.itch_platform(), 'itch_platform windows')

  mock.expects('platform').returns('linux')
  t.is('linux', os.itch_platform(), 'itch_platform linux')

  mock.expects('platform').returns('darwin')
  t.is('osx', os.itch_platform(), 'itch_platform osx')

  t.is(os.cli_args(), process.argv)

  return t.all([
    [os.check_presence('npm', ['-v']), 'check presence'],
    [t.rejects(os.check_presence('kalamazoo123')), 'check absence']
  ])
})
