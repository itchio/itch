import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

import log from '../app/util/log'
import electron from './stubs/electron'
import InstallStore from './stubs/install-store'

let setup = t => {
  let child_process = {
    exec: () => null,
    '@noCallThru': true
  }
  let os = {
    platform: () => 'win32'
  }

  let stubs = assign({
    '../stores/install-store': InstallStore,
    '../util/os': os,
    'child_process': child_process
  }, electron)

  let {shell} = electron
  let launch = proxyquire('../app/tasks/launch', stubs)
  return {launch, child_process, os, shell}
}

let logger = new log.Logger({sinks: {console: false}})
let opts = {id: 'kalamazoo', logger}

test('launch', t => {
  let {launch, child_process, os, shell} = setup(t)

  t.case('rejects 0 execs', t => {
    let spy = t.spy()
    t.stub(InstallStore, 'get_install').resolves({})
    return launch.start(opts).catch(spy).then(_ => {
      t.is(spy.callCount, 1)
      t.same(spy.getCall(0).args[0].message, 'No executables found')
    })
  })

  t.case('launches top-most exec', t => {
    t.stub(InstallStore, 'get_install').resolves({
      executables: [ '/a/b/c', '/a/bababa', '/a/b/c/d' ]
    })
    t.mock(launch).expects('launch').once().withArgs('/a/bababa').resolves('Done!')
    return launch.start(opts)
  })

  t.case('launch/darwin', t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(launch).expects('sh').once().withArgs('Dumbo.app', `open -W "Dumbo.app"`).resolves('Done!')
    return launch.launch('Dumbo.app', [])
  })

  t.case('launch/darwin - with args', t => {
    t.stub(os, 'platform').returns('darwin')
    t.mock(launch).expects('sh').once().withArgs('Dumbo.app', `open -W "Dumbo.app" --args "dumb" "du\\"mber" "frank spencer"`).resolves('Done!')
    return launch.launch('Dumbo.app', ['dumb', 'du"mber', 'frank spencer'])
  })

  t.case('launch/win32', t => {
    t.mock(launch).expects('sh').once().withArgs('dumbo.exe', `"dumbo.exe"`).resolves('Done!')
    return launch.launch('dumbo.exe', [])
  })

  t.case('launch/win32 -with args', t => {
    t.mock(launch).expects('sh').once().withArgs('dumbo.exe', `"dumbo.exe" "dumb" "du\\"mber" "frank spencer"`).resolves('Done!')
    return launch.launch('dumbo.exe', ['dumb', 'du"mber', 'frank spencer'])
  })

  t.case('launch/unknown', t => {
    t.stub(os, 'platform').returns('irix')
    t.mock(shell).expects('openItem').once().withArgs('dumbo').returns()
    return launch.launch('dumbo', [])
  })

  t.case('sh sanity filter 1', t => {
    return t.rejects(launch.sh('dumbo', 'dumbo & fork-bomb', opts))
  })

  t.case('sh sanity filter 2', t => {
    return t.rejects(launch.sh('dumbo', 'dumbo ; evil', opts))
  })

  t.case('sh error', t => {
    t.mock(child_process).expects('exec').once().callsArgWith(2, new Error('crash!'), '', '')
    return t.rejects(launch.sh('dumbo', 'dumbo --fullscreen --no-sound', opts))
  })

  t.case('sh successful', t => {
    t.mock(child_process).expects('exec').once().callsArgWith(2, null, '', '')
    return launch.sh('dumbo', 'dumbo --fullscreen --no-sound', opts)
  })
})
