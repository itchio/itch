import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

let initialize = t => {
  let os = {
    check_presence: () => Promise.resolve(),
    platform: () => 'win32'
  }
  let http = {
    request: () => null
  }
  let stubs = Object.assign({
    './os': os,
    './http': http
  }, electron)
  let setup = proxyquire('../app/util/setup', stubs)

  return {setup, os, http}
}

test('setup', t => {
  let {setup, os, http} = initialize(t)

  t.case('augment_path', t => {
    let path = setup.augment_path()
    t.true(process.env.PATH.endsWith(path), 'added')
  })

  t.case('binary_url', t => {
    let platform = t.stub(os, 'platform')

    platform.returns('darwin')
    t.is('7za', setup.binary_url().file)

    platform.returns('win32')
    t.is('7za.exe', setup.binary_url().file)

    platform.returns('linux')
    t.throws(() => setup.binary_url())
  })

  t.case('run', t => {
    t.stub(os, 'check_presence').resolves()
    return setup.run({})
  })

  t.case('run (download)', t => {
    t.stub(os, 'check_presence').rejects()
    t.mock(http).expects('request').once().resolves()
    return setup.run({})
  })
})
