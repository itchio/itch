'use nodent';'use strict'
let test = require('zopf')
let contains = require('underscore').contains

let os = require('../../app/util/os')

test('os', t => {
  let mock = t.mock(os)

  t.ok(contains(['win32', 'linux', 'darwin'], os.platform()), 'is known')

  mock.expects('platform').returns('win32')
  t.is('windows', os.itch_platform(), 'itch_platform windows')

  mock.expects('platform').returns('linux')
  t.is('linux', os.itch_platform(), 'itch_platform linux')

  mock.expects('platform').returns('darwin')
  t.is('osx', os.itch_platform(), 'itch_platform osx')

  t.is(os.process_type(), 'browser', 'process_type')
  t.is(os.cli_args(), process.argv, 'cli args')

  t.case('check presence', t => {
    return os.check_presence('npm', ['-v'])
  })

  t.case('check absence', t => {
    return t.rejects(os.check_presence('kalamzoo123'))
  })
})
