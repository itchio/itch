import test from 'zopf'
import proxyquire from 'proxyquire'
import Promise from 'bluebird'

import {PassThrough} from 'stream'
import {EventEmitter} from 'events'

import electron from '../stubs/electron'

test('http', t => {
  let http_opts = {
    url: 'http://-invalid/hello.txt',
    dest: '/dev/null',
    onprogress: () => {}
  }

  let child = Object.assign({
    stdout: new PassThrough()
  }, EventEmitter.prototype)

  let child_process = {
    spawn: () => child,
    mkdirp: () => Promise.resolve()
  }

  let stubs = Object.assign({
    'child_process': child_process
  }, electron)

  let http = proxyquire('../../app/util/http', stubs)

  t.case('resolves on close', t => {
    setTimeout(() => { child.emit('close') }, 10)
    return http.request(http_opts)
  })

  t.case('rejects error', t => {
    setTimeout(() => { child.emit('error') }, 10)
    return t.rejects(http.request(http_opts))
  })

  t.case('emits progress', t => {
    setTimeout(() => {
      child.stdout.write(JSON.stringify({Percent: 39}) + '\n')
      child.emit('close')
    }, 10)
    t.mock(http_opts).expects('onprogress').withArgs({percent: 39})
    return http.request(http_opts)
  })

  // t.case('rejects errors', t => {
  //   setImmediate(() => { tube.emit('error', 'meow') })
  //   return t.rejects(http.request(get_http_opts()))
  // })
  //
  // t.case('progress', t => {
  //   let http_opts = get_http_opts()
  //   t.mock(http_opts).expects('onprogress').withArgs({percent: 25})
  //
  //   setImmediate(() => {
  //     tube.emit('headers', {'content-length': 512})
  //     tube.write(new Buffer(64))
  //   })
  //
  //   setImmediate(() => {
  //     tube.write(new Buffer(64))
  //   })
  //
  //   setTimeout(() => {
  //     tube.end()
  //   }, 20)
  //   return http.request(http_opts)
  // })
})
