
let EventEmitter = require('events').EventEmitter
let test = require('zopf')
let proxyquire = require('proxyquire')
let path = require('path')

import { indexBy } from 'underline'

let electron = require('../stubs/electron')
let CaveStore = require('../stubs/cave-store')

let log = require('../../app/util/log')

let logger = new log.Logger({sinks: {console: false}})
let opts = {id: 'kalamazoo', logger}

function make_dummy () {
  let d = new EventEmitter()
  ;['stderr', 'stdout'].forEach((type) => {
    d[type] = {
      pipe: (x) => x
    }
  })
  return d
}

let rnil = () => null

test('launch', t => {
  let configure = {
    start: () => Promise.resolve()
  }

  let native = { launch: () => Promise.resolve() }
  let html = { launch: () => Promise.resolve() }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    './configure': configure,
    './launch/native': native,
    './launch/html': html
  }, electron)

  let launch = proxyquire('../../app/tasks/launch', stubs)

  t.case('rejects 0 execs', t => {
    let spy = t.spy()
    t.stub(CaveStore, 'find').returns({ launch_type: 'native' })
    return launch.start(opts).catch(spy).then(_ => {
      t.is(spy.callCount, 1)
      t.same(spy.getCall(0).args[0].message, 'Cave is invalid')
    })
  })

  t.case('reconfigures as needed', async t => {
    let find = t.stub(CaveStore, 'find')
    find.returns({ executables: [], launch_type: 'native' })
    t.stub(configure, 'start', () => {
      find.returns({ executables: ['/a'], launch_type: 'native' })
      return Promise.resolve()
    })
    t.mock(native).expects('launch').once().resolves('Done!')
    await launch.start(opts)
  })

  t.case('launches correct launch_type', async t => {
    let find = t.stub(CaveStore, 'find')
    find.returns({ executables: ['./a'], launch_type: 'native' })
    t.mock(native).expects('launch').once().resolves('Done!')
    await launch.start(opts)
    find.returns({ game_path: 'a/a.html', window_size: {width: 1, height: 1}, launch_type: 'html' })
    t.mock(html).expects('launch').once().resolves('Done!')
    await launch.start(opts)
  })

  t.case('rejects invalid launch_type', t => {
    let spy = t.spy()
    t.stub(CaveStore, 'find').returns({ launch_type: 'invalid' })
    return launch.start(opts).catch(spy).then(_ => {
      t.is(spy.callCount, 1)
      t.same(spy.getCall(0).args[0].message, 'Unsupported launch type \'invalid\'')
    })
  })
})

test('launch/native', t => {
  let child_process = {
    spawn: () => null,
    '@noCallThru': true,
    '@global': true
  }

  let os = {
    platform: () => 'win32'
  }

  let sf = {
    stat: async () => ({size: 0})
  }

  let stubs = Object.assign({
    '../../stores/cave-store': CaveStore,
    '../../util/sf': sf,
    '../../util/os': os,
    'child_process': child_process
  }, electron)

  let native = proxyquire('../../app/tasks/launch/native', stubs)

  t.case('launches top-most exec', t => {
    let cave = {
      executables: [ '/a/b/c', '/a/bababa', '/a/b/c/d' ]
    }
    t.mock(native).expects('launch_executable').once().withArgs(path.normalize('/tmp/app/a/bababa')).resolves('Done!')
    return native.launch(opts, cave)
  })

  t.case('ignores uninstallers', async t => {
    let cave = {
      executables: [ 'uninstall.exe', 'game.exe' ]
    }
    t.mock(native).expects('launch_executable').once().withArgs(path.normalize('/tmp/app/game.exe')).resolves('Done!')
    await native.launch(opts, cave)
  })

  t.case('ignores dxwebsetup', async t => {
    let cave = {
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
    let dummy = make_dummy()
    t.mock(child_process).expects('spawn').returns(dummy)
    let p = native.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    dummy.emit('error')

    await t.rejects(p)
  })

  t.case('sh successful', async t => {
    let dummy = make_dummy()
    t.mock(child_process).expects('spawn').returns(dummy)
    let p = native.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    dummy.emit('close', 0)
    await p
  })

  t.case('sh non-zero', async t => {
    let dummy = make_dummy()
    t.mock(child_process).expects('spawn').returns(dummy)
    let p = native.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    dummy.emit('close', 127)
    await t.rejects(p)
  })
})

test('launch/html', t => {
  let fake_server = {
    listen: rnil,
    on: (event, func) => {
      func()
    },
    address: () => {
      return {port: 1234}
    },
    close: rnil
  }

  let http_server = {
    create: () => {
      return fake_server
    }
  }

  let bag = {
    games: [
      // has to match with stubs/cave-store
      {id: 84, title: 'I wanna be the weegee'}
    ]::indexBy('id')
  }
  let market = {
    get_entities: (x) => bag[x],
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../../stores/cave-store': CaveStore,
    '../../util/market': market,
    '../../util/http-server': http_server
  }, electron)

  let html = proxyquire('../../app/tasks/launch/html', stubs)

  let cave = {
    game_id: 84,
    game_path: 'blah/i.html',
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
