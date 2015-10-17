import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'
import path from 'path'
import Promise from 'bluebird'

import electron from './stubs/electron'
import InstallStore from './stubs/install-store'
import AppActions from './stubs/app-actions'

import log from '../app/util/log'
let logger = new log.Logger({sinks: {console: false}})
let opts = {id: 'kalamazoo', logger}

let setup = t => {
  let os = {}

  let noop = () => Promise.resolve()
  let win32 = {configure: noop}
  let darwin = {configure: noop}
  let linux = {configure: noop}

  let stubs = assign({
    '../util/os': os,
    './configurators/win32': win32,
    './configurators/darwin': darwin,
    './configurators/linux': linux,
    '../stores/install-store': InstallStore,
    '../actions/app-actions': AppActions
  }, electron)

  let configure = proxyquire('../app/tasks/configure', stubs)

  return {configure, os, win32, linux, darwin}
}

test('configure', t => {
  let objects = setup(t)
  let {configure, os} = objects

  t.case('rejects unsupported platform', t => {
    t.stub(os, 'platform').returns('irix')
    return t.rejects(configure.start(opts))
  })

  ;['win32', 'darwin', 'linux'].forEach((platform) => {
    t.case(platform, t => {
      t.stub(os, 'platform').returns(platform)
      t.mock(objects[platform]).expects('configure').resolves({executables: []})
      return configure.start(opts)
    })
  })

  let win32 = proxyquire('../app/tasks/configurators/win32', {})
  let win32_path = `${__dirname}/fixtures/configure/win32`

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

  let common = {
    fix_execs: () => Promise.resolve()
  }
  let darwin = proxyquire('../app/tasks/configurators/darwin', {
    './common': common
  })
  let darwin_path = `${__dirname}/fixtures/configure/darwin`

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

  let linux = proxyquire('../app/tasks/configurators/linux', {
    '../../promised/fs': {
      chmodAsync: () => Promise.resolve(),
      '@global': true,
      '@noCallThru': true
    }
  })
  let linux_path = `${__dirname}/fixtures/configure/linux`

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
