import test from 'zopf'
import proxyquire from 'proxyquire'

let setup = t => {
  let app = {
    quit: () => null,
    '@noCallThru': true
  }

  let os = {
    platform: () => 'win32',
    cli_args: () => [],
    '@noCallThru': true
  }

  let squirrel = proxyquire('../../app/util/squirrel', {
    'app': app,
    './os': os
  })

  return {squirrel, app, os}
}

test('handle_startup_event should be bypassed on darwin', t => {
  let {os, squirrel} = setup(t)
  t.stub(os, 'platform').returns('darwin')
  t.false(squirrel.handle_startup_event())
})

test('handle_startup_event should be bypassed on linux', t => {
  let {os, squirrel} = setup(t)
  t.stub(os, 'platform').returns('linux')
  t.false(squirrel.handle_startup_event())
})

test(`handle_startup_event should noop when no squirrel cli args`, t => {
  let {squirrel} = setup(t)
  t.false(squirrel.handle_startup_event())
})

;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
  test(`handle_startup_event should quit app on ${action}`, t => {
    let {os, app, squirrel} = setup(t)
    t.stub(os, 'platform').returns('win32')
    t.stub(os, 'cli_args').returns(['hi mom', `--squirrel-${action}`])
    t.mock(app).expects('quit').once()
    t.true(squirrel.handle_startup_event())
  })
})
