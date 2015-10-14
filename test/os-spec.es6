import test from 'zopf'
import proxyquire from 'proxyquire'
import {contains} from 'underscore'

proxyquire.noPreserveCache()

let setup = t => {
  let os = proxyquire('../app/util/os', {})
  return {os}
}

test('platform', t => {
  let {os} = setup(t)
  t.ok(contains(['win32', 'linux', 'darwin'], os.platform()), 'is known')
})

test('itch_platform', t => {
  let {os} = setup(t)
  let mock = t.mock(os)

  mock.expects('platform').returns('win32')
  t.is('windows', os.itch_platform())

  mock.expects('platform').returns('linux')
  t.is('linux', os.itch_platform())

  mock.expects('platform').returns('darwin')
  t.is('osx', os.itch_platform())
})

test('cli_args', t => {
  let {os} = setup(t)
  t.is(os.cli_args(), process.argv)
})
