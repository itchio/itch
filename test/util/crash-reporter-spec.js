'use nodent';'use strict'
let test = require('zopf')
let sinon = require('sinon')
let proxyquire = require('proxyquire')

let electron = require('../stubs/electron')

let setup = t => {
  let fstream = {
    Writer: () => fstream,
    write: () => fstream,
    end: () => fstream
  }
  let os = {
    platform: () => 'linux'
  }
  let stubs = Object.assign({
    'fstream': fstream,
    './os': os
  }, electron)
  let crash_reporter = proxyquire('../../app/util/crash-reporter', stubs)
  return {crash_reporter, os, fstream, electron}
}

test('crash-reporter', t => {
  let {crash_reporter, os, fstream, electron} = setup(t)
  let e = { stack: 'Hey\nthere' }

  t.case('write_crash_log', t => {
    let mock = t.mock(fstream)
    mock.expects('write').once().withArgs('Hey\nthere').returns(fstream)
    crash_reporter.write_crash_log(e)
  })

  t.case('write_crash_log (win32)', t => {
    t.stub(os, 'platform').returns('win32')
    let mock = t.mock(fstream)
    mock.expects('write').once().withArgs('Hey\r\nthere').returns(fstream)
    crash_reporter.write_crash_log(e)
  })

  t.case('report_issue', t => {
    let mock = t.mock(electron.shell)
    mock.expects('openExternal').once()
    crash_reporter.report_issue(e)
  })

  let stub_write = (t) => {
    t.stub(crash_reporter, 'write_crash_log').returns({log: e.stack, crash_file: 'tmp/crash_log.txt'})
  }

  t.case('handle → close', t => {
    stub_write(t)
    t.stub(electron.dialog, 'showMessageBox').returns(-1)
    crash_reporter.handle(e)
  })

  t.case('handle → report_issue', t => {
    stub_write(t)
    t.stub(electron.dialog, 'showMessageBox').returns(0)
    t.mock(crash_reporter).expects('report_issue').once()
    crash_reporter.handle(e)
  })

  t.case('handle → open_item', t => {
    stub_write(t)
    t.stub(electron.dialog, 'showMessageBox').returns(1)
    t.mock(electron.shell).expects('openItem').once()
    crash_reporter.handle(e)
  })

  t.case('mount', t => {
    let exit = t.stub(process, 'exit')
    t.stub(process, 'on').callsArgWith(1, e)
    t.mock(crash_reporter).expects('handle').once().throws('Test error, please ignore')
    crash_reporter.mount()
    sinon.assert.calledWith(exit, 1)
  })
})
