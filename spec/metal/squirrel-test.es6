import test from 'tape-catch'
import sinon from 'sinon'
import mock from 'mock-require'

import os from '../../metal/util/os'

let app = {
  quit: () => null
}
mock('app', app)

let squirrel = require('../../metal/squirrel')

test('handle_startup_event should be bypassed on darwin', sinon.test(function (t) {
  this.stub(os, 'platform', () => 'darwin')
  t.false(squirrel.handle_startup_event())
  t.end()
}))

test('handle_startup_event should be bypassed on linux', sinon.test(function (t) {
  this.stub(os, 'platform', () => 'linux')
  t.false(squirrel.handle_startup_event())
  t.end()
}))

;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
  test(`handle_startup_event should quit app on ${action}`, sinon.test(function (t) {
    this.stub(os, 'platform', () => 'win32')
    this.stub(os, 'cli_args', () => ['hi mom', `--squirrel-${action}`])
    this.mock(app).expects('quit').once()
    t.true(squirrel.handle_startup_event())
    t.end()
  }))
})

test(`handle_startup_event should do nothing on windows when no squirrel command line argument`, sinon.test(function (t) {
  this.stub(os, 'platform', () => 'win32')
  t.false(squirrel.handle_startup_event())
  t.end()
}))
