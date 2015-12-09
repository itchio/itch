'use nodent';'use strict'
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

  let child

  let child_process = {
    spawn: () => {
      child = Object.assign({
        stdout: new PassThrough()
      }, EventEmitter.prototype)
      return child
    },
    mkdirp: () => Promise.resolve(),
    '@global': true
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
      child.stdout.write(JSON.stringify({type: 'progress', percentage: 39}) + '\n')
      child.emit('close')
    }, 10)
    t.mock(http_opts).expects('onprogress').withArgs({percent: 39})
    return http.request(http_opts)
  })
})
