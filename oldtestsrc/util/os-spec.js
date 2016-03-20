
import test from 'zopf'
import {contains} from 'underline'

import os from '../../app/util/os'

test('os', t => {
  const mock = t.mock(os)

  t.ok(['win32', 'linux', 'darwin']::contains(os.platform()), 'is known')

  mock.expects('platform').returns('win32')
  t.is('windows', os.itch_platform(), 'itch_platform windows')

  mock.expects('platform').returns('linux')
  t.is('linux', os.itch_platform(), 'itch_platform linux')

  mock.expects('platform').returns('darwin')
  t.is('osx', os.itch_platform(), 'itch_platform osx')

  t.is(os.process_type(), 'browser', 'process_type')
  t.is(os.cli_args(), process.argv, 'cli args')

  t.case('assert presence', t => {
    return os.assert_presence('node', ['-v'])
  })

  t.case('assert absence', t => {
    return t.rejects(os.assert_presence('kalamzoo123'))
  })
})
