
import test from 'zopf'
import proxyquire from 'proxyquire'
import path from 'path'

import {indexBy} from 'underline'

import electron from '../stubs/electron'
import CaveStore from '../stubs/cave-store'

import log from '../../app/util/log'
const logger = new log.Logger({sinks: {console: false}})
const opts = {id: 'kalamazoo', logger}

const rnil = () => null

test('launch', t => {
  const configure = test.module({
    start: () => Promise.resolve()
  })

  const native = test.module({launch: () => Promise.resolve()})
  const html = test.module({launch: () => Promise.resolve()})

  const stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    './configure': configure,
    './launch/native': native,
    './launch/html': html
  }, electron)

  const launch = proxyquire('../../app/tasks/launch', stubs).default

  t.case('rejects 0 execs', t => {
    const spy = t.spy()
    t.stub(CaveStore, 'find').returns({launch_type: 'native'})
    return launch.start(opts).catch(spy).then(_ => {
      t.is(spy.callCount, 1)
      t.same(spy.getCall(0).args[0].message, 'Cave is invalid')
    })
  })

  t.case('reconfigures as needed', async t => {
    const find = t.stub(CaveStore, 'find')
    find.returns({executables: [], launch_type: 'native'})
    t.stub(configure, 'start', () => {
      find.returns({executables: ['/a'], launch_type: 'native'})
      return Promise.resolve()
    })
    t.mock(native).expects('launch').once().resolves('Done!')
    await launch.start(opts)
  })

  t.case('launches correct launch_type', async t => {
    const find = t.stub(CaveStore, 'find')
    find.returns({executables: ['./a'], launch_type: 'native'})
    t.mock(native).expects('launch').once().resolves('Done!')
    await launch.start(opts)
    find.returns({ gamePath: 'a/a.html', window_size: {width: 1, height: 1}, launch_type: 'html' })
    t.mock(html).expects('launch').once().resolves('Done!')
    await launch.start(opts)
  })

  t.case('rejects invalid launch_type', t => {
    const spy = t.spy()
    t.stub(CaveStore, 'find').returns({launch_type: 'invalid'})
    return launch.start(opts).catch(spy).then(_ => {
      t.is(spy.callCount, 1)
      t.same(spy.getCall(0).args[0].message, 'Unsupported launch type \'invalid\'')
    })
  })
})

test('launch/native', t => {
  let on_spawn = async () => null
  const spawn = test.module(async function () {
    return await on_spawn()
  })

  const os = test.module({
    platform: () => 'win32'
  })

  const sf = test.module({
    stat: async () => ({size: 0})
  })

  const stubs = Object.assign({
    '../../stores/cave-store': CaveStore,
    '../../util/sf': sf,
    '../../util/os': os,
    '../../util/spawn': spawn
  }, electron)

  const native = proxyquire('../../app/tasks/launch/native', stubs).default

  t.case('launches top-most exec', t => {
    const cave = {
      executables: [ '/a/b/c', '/a/bababa', '/a/b/c/d' ]
    }
    t.mock(native).expects('launch_executable').once().withArgs(path.normalize('/tmp/app/a/bababa')).resolves('Done!')
    return native.launch(opts, cave)
  })

  t.case('ignores uninstallers', async t => {
    const cave = {
      executables: [ 'uninstall.exe', 'game.exe' ]
    }
    t.mock(native).expects('launch_executable').once().withArgs(path.normalize('/tmp/app/game.exe')).resolves('Done!')
    await native.launch(opts, cave)
  })

  t.case('ignores dxwebsetup', async t => {
    const cave = {
      executables: [ 'dxwebsetup.exe', 'game.exe' ]
    }
    t.mock(native).expects('launch_executable').once().withArgs(path.normalize('/tmp/app/game.exe')).resolves('Done!')
    await native.launch(opts, cave)
  })

  t.case('launch/.app', t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(native).expects('sh').once().withArgs('Dumbo.app', `open -W "Dumbo.app"`).resolves('Done!')
    return native.launch_executable('Dumbo.app', [])
  })

  t.case('launch/.app - with args', async t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(native).expects('sh').once().withArgs('Dumbo.app', `open -W "Dumbo.app" --args "dumb" "du\\"mber" "frank spencer"`).resolves('Done!')
    await native.launch_executable('Dumbo.app', ['dumb', 'du"mber', 'frank spencer'])
  })

  t.case('launch/binary', async t => {
    t.mock(native).expects('sh').once().withArgs('dumbo.exe', `"dumbo.exe"`).resolves('Done!')
    await native.launch_executable('dumbo.exe', [])
  })

  t.case('launch/binary -with args', async t => {
    t.mock(native).expects('sh').once().withArgs('dumbo.exe', `"dumbo.exe" "dumb" "du\\"mber" "frank spencer"`).resolves('Done!')
    await native.launch_executable('dumbo.exe', ['dumb', 'du"mber', 'frank spencer'])
  })

  t.case('launch/unknown', async t => {
    t.stub(os, 'platform').returns('irix')
    t.mock(native).expects('sh').once().withArgs('dumbo', `"dumbo"`).resolves('Done!')
    await native.launch_executable('dumbo', [])
  })

  t.case('sh error', async t => {
    on_spawn = async () => { throw new Error('segfault') }
    const p = native.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    await t.rejects(p)
  })

  t.case('sh successful', async t => {
    on_spawn = async () => 0
    const p = native.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    await p
  })

  t.case('sh non-zero', async t => {
    on_spawn = async () => 127
    const p = native.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    await t.rejects(p)
  })
})

test('launch/html', t => {
  const fake_server = {
    listen: rnil,
    on: (event, func) => {
      func()
    },
    address: () => {
      return {port: 1234}
    },
    close: rnil
  }

  const http_server = test.module({
    create: () => {
      return fake_server
    }
  })

  const bag = {
    games: [
      // has to match with stubs/cave-store
      {id: 84, title: 'I wanna be the weegee'}
    ]::indexBy('id')
  }

  const market = test.module({
    get_entities: (x) => bag[x]
  })

  const stubs = Object.assign({
    '../../stores/cave-store': CaveStore,
    '../../util/market': market,
    '../../util/http-server': http_server
  }, electron)

  const html = proxyquire('../../app/tasks/launch/html', stubs).default

  const cave = {
    game_id: 84,
    gamePath: 'blah/i.html',
    window_size: {
      width: 10,
      height: 10
    }
  }

  t.stub(electron.electron.BrowserWindow, 'on', (action, callback) => {
    callback()
  })

  t.case('serves correct directory', async t => {
    t.mock(http_server).expects('create').once().withArgs(path.normalize('/tmp/app/blah'), {index: ['i.html']}).returns(fake_server)
    await html.launch(opts, cave)
  })

  t.case('loads correct url', async t => {
    t.mock(electron.electron.BrowserWindow).expects('loadURL').once().withArgs('http://localhost:1234')
    await html.launch(opts, cave)
  })
})
