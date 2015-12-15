

let test = require('zopf')
let proxyquire = require('proxyquire')
let path = require('path')
let Promise = require('bluebird')

let fixture = require('../fixture')
let electron = require('../stubs/electron')
let CaveStore = require('../stubs/cave-store')
let AppActions = require('../stubs/app-actions')

let log = require('../../app/util/log')
let logger = new log.Logger({sinks: {console: false}})
let opts = {id: 'kalamazoo', logger}

test('configure', t => {
  let os = {}

  let noop = () => Promise.resolve()
  let win32 = {configure: noop}
  let darwin = {configure: noop}
  let linux = {configure: noop}

  let stubs = Object.assign({
    '../util/os': os,
    './configure/win32': win32,
    './configure/darwin': darwin,
    './configure/linux': linux,
    '../stores/cave-store': CaveStore,
    '../actions/app-actions': AppActions
  }, electron)

  let configure = proxyquire('../../app/tasks/configure', stubs)
  let platforms = {win32, darwin, linux}

  t.case('rejects unsupported platform', t => {
    t.stub(os, 'platform').returns('irix')
    return t.rejects(configure.start(opts))
  })

  ;['win32', 'darwin', 'linux'].forEach((platform) => {
    t.case(platform, t => {
      t.stub(os, 'platform').returns(platform)
      t.mock(platforms[platform]).expects('configure').resolves({executables: []})
      return configure.start(opts)
    })
  })
})

test('configure (each platform)', t => {
  let fs = {
    chmodAsync: () => Promise.resolve(),
    '@global': true,
    '@noCallThru': true
  }
  let stubs = {
    '../../promised/fs': fs
  }

  let win32 = proxyquire('../../app/tasks/configure/win32', stubs)
  let win32_path = fixture.path('configure/win32')

  t.case('win32 finds bats and exes', t => {
    let spy = t.spy()
    return win32.configure(win32_path).then(spy).then(_ => {
      let names = [
        'game.exe', 'launcher.bat',
        path.join('resources', 'editor.exe'),
        path.join('resources', 'quite', 'deep', 'share.bat')
      ]
      let paths = names.map(x => path.join(win32_path, x))
      t.is(1, spy.callCount)
      t.samePaths(paths, spy.getCall(0).args[0].executables)
    })
  })

  let darwin = proxyquire('../../app/tasks/configure/darwin', stubs)
  let darwin_path = fixture.path('configure/darwin')

  t.case('darwin finds app bundles', t => {
    let spy = t.spy()
    return darwin.configure(darwin_path).then(spy).then(_ => {
      let names = [
        'Some Grand Game.app/'
      ]
      let paths = names.map(x => `${darwin_path}/${x}`)
      t.is(1, spy.callCount)
      t.samePaths(paths, spy.getCall(0).args[0].executables)
    })
  })

  let linux = proxyquire('../../app/tasks/configure/linux', stubs)
  let linux_path = fixture.path('configure/linux')

  t.case('darwin finds binaries when no app bundles', t => {
    let spy = t.spy()
    return darwin.configure(linux_path).then(spy).then(_ => {
      let names = [
        'bin/game32',
        'bin/game64',
        'OpenHexagon',
        'quine'
      ]
      let paths = names.map(x => `${linux_path}/${x}`)
      t.is(1, spy.callCount)
      t.samePaths(paths, spy.getCall(0).args[0].executables)
    })
  })

  t.case('linux finds scripts & binaries', t => {
    let spy = t.spy()
    return linux.configure(linux_path).then(spy).then(_ => {
      let names = [
        'bin/game32',
        'bin/game64',
        'OpenHexagon',
        'quine'
      ]
      let paths = names.map(x => `${linux_path}/${x}`)
      t.is(1, spy.callCount)
      t.samePaths(paths, spy.getCall(0).args[0].executables)
    })
  })
})
