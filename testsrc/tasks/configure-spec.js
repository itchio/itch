
import test from 'zopf'
import proxyquire from 'proxyquire'
import path from 'path'

import fixture from '../fixture'
import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'
import AppActions from '../stubs/app-actions'

import log from '../../app/util/log'
const logger = new log.Logger({sinks: {console: false}})
const opts = {id: 'kalamazoo', logger}

test('configure', t => {
  const os = test.module({
    platform: () => null
  })

  const noop = async () => null
  const win32 = test.module({configure: noop})
  const darwin = test.module({configure: noop})
  const linux = test.module({configure: noop})

  const stubs = Object.assign({
    '../util/os': os,
    './configure/win32': win32,
    './configure/darwin': darwin,
    './configure/linux': linux,
    '../stores/cave-store': CaveStore,
    '../actions/app-actions': AppActions
  }, electron)

  const configure = proxyquire('../../app/tasks/configure', stubs).default
  const platforms = {win32, darwin, linux}

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

import real_sf from '../../app/util/sf'

test('configure (each platform)', t => {
  const sf = test.module({
    chmod: async () => null,
    glob: real_sf.glob.bind(real_sf),
    '@global': true
  })
  const stubs = {
    '../../util/sf': sf
  }

  const win32 = proxyquire('../../app/tasks/configure/win32', stubs).default
  const win32_path = fixture.path('configure/win32')

  t.case('win32 finds bats and exes', async t => {
    const res = await win32.configure(win32_path)
    const names = [
      'game.exe', 'launcher.bat',
      path.join('resources', 'editor.exe'),
      path.join('resources', 'quite', 'deep', 'share.bat')
    ]
    t.samePaths(res.executables, names)
  })

  const darwin = proxyquire('../../app/tasks/configure/darwin', stubs).default
  const darwin_path = fixture.path('configure/darwin')
  const darwin_nested_path = fixture.path('configure/darwin-nested')

  t.case('darwin finds app bundles', async t => {
    const res = await darwin.configure(darwin_path)
    const names = [
      'Some Grand Game.app/'
    ]
    t.samePaths(res.executables, names)
  })

  t.case('darwin finds nested app bundles', async t => {
    const res = await darwin.configure(darwin_nested_path)
    const names = [
      'osx64/dragonjousting.app/',
      'osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper.app/',
      'osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper NP.app/',
      'osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper EH.app/'
    ]
    t.samePaths(res.executables, names)
  })

  const linux = proxyquire('../../app/tasks/configure/linux', stubs).default
  const linux_path = fixture.path('configure/linux')

  t.case('darwin finds binaries when no app bundles', async t => {
    const res = await darwin.configure(linux_path)
    const names = [
      'bin/mach-o',
      'bin/mach-o-bis',
      'OpenHexagon',
      'quine'
    ]
    t.samePaths(res.executables, names)
  })

  t.case('linux finds scripts & binaries', async t => {
    const res = await linux.configure(linux_path)
    const names = [
      'bin/game32',
      'bin/game64',
      'OpenHexagon',
      'quine'
    ]
    t.samePaths(res.executables, names)
  })

  const html = proxyquire('../../app/tasks/configure/html', stubs).default
  const html_path = fixture.path('configure/html')

  t.case('html finds game root', async t => {
    const res = await html.configure(html_path)
    t.same(res.game_path, 'ThisContainsStuff/index.html')
  })
})
