
import test from 'zopf'
import proxyquire from 'proxyquire'
import path from 'path'

import fixture from '../fixture'
import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import AppActions from '../stubs/app-actions'

import log from '../../app/util/log'
let logger = new log.Logger({sinks: {console: false}})
let opts = {id: 'kalamazoo', logger}

test('configure', t => {
  let os = {}

  let noop = async () => null
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
  let sf = {
    chmod: async () => null,
    '@global': true
  }
  let stubs = {
    '../../util/sf': sf
  }

  let win32 = proxyquire('../../app/tasks/configure/win32', stubs)
  let win32_path = fixture.path('configure/win32')

  t.case('win32 finds bats and exes', async t => {
    let res = await win32.configure(win32_path)
    let names = [
      'game.exe', 'launcher.bat',
      path.join('resources', 'editor.exe'),
      path.join('resources', 'quite', 'deep', 'share.bat')
    ]
    t.samePaths(res.executables, names)
  })

  let darwin = proxyquire('../../app/tasks/configure/darwin', stubs)
  let darwin_path = fixture.path('configure/darwin')
  let darwin_nested_path = fixture.path('configure/darwin-nested')

  t.case('darwin finds app bundles', async t => {
    let res = await darwin.configure(darwin_path)
    let names = [
      'Some Grand Game.app/'
    ]
    t.samePaths(res.executables, names)
  })

  t.case('darwin finds nested app bundles', async t => {
    let res = await darwin.configure(darwin_nested_path)
    let names = [
      'osx64/dragonjousting.app/',
      'osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper.app/',
      'osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper NP.app/',
      'osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper EH.app/'
    ]
    t.samePaths(res.executables, names)
  })

  let linux = proxyquire('../../app/tasks/configure/linux', stubs)
  let linux_path = fixture.path('configure/linux')

  t.case('darwin finds binaries when no app bundles', async t => {
    let res = await darwin.configure(linux_path)
    let names = [
      'bin/mach-o',
      'bin/mach-o-bis',
      'OpenHexagon',
      'quine'
    ]
    t.samePaths(res.executables, names)
  })

  t.case('linux finds scripts & binaries', async t => {
    let res = await linux.configure(linux_path)
    let names = [
      'bin/game32',
      'bin/game64',
      'OpenHexagon',
      'quine'
    ]
    t.samePaths(res.executables, names)
  })

  let html = proxyquire('../../app/tasks/configure/html', stubs)
  let html_path = fixture.path('configure/html')

  t.case('html finds game root', async t => {
    let res = await html.configure(html_path)
    t.same(res.game_path, 'ThisContainsStuff/index.html')
  })
})
