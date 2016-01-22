
let EventEmitter = require('events').EventEmitter
let test = require('zopf')
let proxyquire = require('proxyquire')
let path = require('path')

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

test('launch', t => {
  let child_process = {
    spawn: () => null,
    '@noCallThru': true,
    '@global': true
  }
  let os = {
    platform: () => 'win32'
  }

  let configure = {
    start: async () => null
  }

  let sf = {
    stat: async () => ({size: 0})
  }

  let stubs = Object.assign({
    '../stores/cave-store': CaveStore,
    '../util/sf': sf,
    '../util/os': os,
    './configure': configure,
    'child_process': child_process
  }, electron)

  let launch = proxyquire('../../app/tasks/launch', stubs)

  t.case('rejects 0 execs', async t => {
    t.stub(CaveStore, 'find').resolves({})

    let err
    try {
      await launch.start(opts)
    } catch (e) { err = e }
    t.same(err.message, 'No executables found')
  })

  t.case('launches top-most exec', async t => {
    t.stub(CaveStore, 'find').resolves({
      executables: [ '/a/b/c', '/a/bababa', '/a/b/c/d' ]
    })
    t.mock(launch).expects('launch').once().withArgs(path.normalize('/tmp/app/a/bababa')).resolves('Done!')
    await launch.start(opts)
  })

  t.case('ignores uninstallers', async t => {
    t.stub(CaveStore, 'find').resolves({
      executables: [ 'uninstall.exe', 'game.exe' ]
    })
    t.mock(launch).expects('launch').once().withArgs(path.normalize('/tmp/app/game.exe')).resolves('Done!')
    await launch.start(opts)
  })

  t.case('ignores dxwebsetup', async t => {
    t.stub(CaveStore, 'find').resolves({
      executables: [ 'dxwebsetup.exe', 'game.exe' ]
    })
    t.mock(launch).expects('launch').once().withArgs(path.normalize('/tmp/app/game.exe')).resolves('Done!')
    await launch.start(opts)
  })

  t.case('reconfigures as needed', async t => {
    let find = t.stub(CaveStore, 'find')
    find.resolves({ executables: [] })
    t.stub(configure, 'start', async () => {
      find.resolves({ executables: ['/a'] })
    })
    t.mock(launch).expects('launch').once().withArgs(path.normalize('/tmp/app/a')).resolves('Done!')
    await launch.start(opts)
  })

  t.case('launch/.app', async t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(launch).expects('sh').once().withArgs('Dumbo.app', `open -W "Dumbo.app"`).resolves('Done!')
    await launch.launch('Dumbo.app', [])
  })

  t.case('launch/.app - with args', async t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(launch).expects('sh').once().withArgs('Dumbo.app', `open -W "Dumbo.app" --args "dumb" "du\\"mber" "frank spencer"`).resolves('Done!')
    await launch.launch('Dumbo.app', ['dumb', 'du"mber', 'frank spencer'])
  })

  t.case('launch/binary', async t => {
    t.mock(launch).expects('sh').once().withArgs('dumbo.exe', `"dumbo.exe"`).resolves('Done!')
    await launch.launch('dumbo.exe', [])
  })

  t.case('launch/binary -with args', async t => {
    t.mock(launch).expects('sh').once().withArgs('dumbo.exe', `"dumbo.exe" "dumb" "du\\"mber" "frank spencer"`).resolves('Done!')
    await launch.launch('dumbo.exe', ['dumb', 'du"mber', 'frank spencer'])
  })

  t.case('launch/unknown', async t => {
    t.stub(os, 'platform').returns('irix')
    t.mock(launch).expects('sh').once().withArgs('dumbo', `"dumbo"`).resolves('Done!')
    await launch.launch('dumbo', [])
  })

  t.case('sh error', async t => {
    let dummy = make_dummy()
    t.mock(child_process).expects('spawn').returns(dummy)
    let p = launch.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    dummy.emit('error')

    await t.rejects(p)
  })

  t.case('sh successful', async t => {
    let dummy = make_dummy()
    t.mock(child_process).expects('spawn').returns(dummy)
    let p = launch.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    dummy.emit('close', 0)
    await p
  })

  t.case('sh non-zero', async t => {
    let dummy = make_dummy()
    t.mock(child_process).expects('spawn').returns(dummy)
    let p = launch.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
    dummy.emit('close', 127)
    await t.rejects(p)
  })
})
