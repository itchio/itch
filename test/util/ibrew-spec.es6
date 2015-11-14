import test from 'zopf'
import proxyquire from 'proxyquire'
import Promise from 'bluebird'
import {PassThrough} from 'stream'

import electron from '../stubs/electron'
import log from '../../app/util/log'

test('ibrew', t => {
  let opts = {
    onstatus: (msg) => console.log(msg),
    logger: new log.Logger()
  }
  let os = {
    platform: () => 'win32',
    arch: () => 'x64'
  }
  let needle = {
    get: () => Promise.reject()
  }
  let fstream = {
    Writer: () => {
      let pt = new PassThrough()
      pt.on('data', () => null)
      return pt
    }
  }
  let extract = {
    extract: () => Promise.resolve()
  }
  let stubs = Object.assign({
    'needle': needle,
    'fstream': fstream,
    './os': os,
    '../tasks/extract': extract
  }, electron)
  let ibrew = proxyquire('../../app/util/ibrew', stubs)

  t.case('compares versions', t => {
    t.ok(ibrew.version_equal('v1.23', '1.23'), 'equal versions')
    t.notOk(ibrew.version_equal('v1.23', 'v1.24'), 'unequal versions')
  })

  t.case('os / arch', t => {
    t.is('windows', ibrew.os())
    t.is('amd64', ibrew.arch())
    t.stub(os, 'platform').returns('linux')
    t.stub(os, 'arch').returns('ia32')
    t.is('linux', ibrew.os())
    t.is('386', ibrew.arch())
    os.arch.returns('armv7')
    t.is('unknown', ibrew.arch())
  })

  t.case('archive_name', t => {
    t.is('butler.7z', ibrew.archive_name('butler'))
    t.is('7za.exe', ibrew.archive_name('7za'))
    t.stub(os, 'platform').returns('linux')
    t.is('7za', ibrew.archive_name('7za'))
    ibrew.formulas.namaste = {format: 'A4'}
    t.throws(() => ibrew.archive_name('namaste'))
  })

  t.case('with all deps', t => {
    t.stub(os, 'check_presence').resolves({parsed: '1.0'})
    t.stub(needle, 'get').callsArgWith(1, null, {statusCode: 200, body: '1.0'})
    let opts = {}
    return Promise.resolve(['7za', 'butler'])
      .each((f) => ibrew.fetch(opts, f))
  })

  t.case('without all deps', t => {
    let check = t.stub(os, 'check_presence')
    check.onCall(0).rejects('nope!')
    check.onCall(1).resolves({parsed: '0.8'})
    t.stub(needle, 'get', function (url, cb) {
      if (cb) {
        cb(null, {statusCode: 200, body: '1.0'})
      } else {
        let req = {
          pipe: (sink) => {
            setTimeout(() => {
              sink.emit('close')
            }, 20)
          },
          on: () => null
        }
        return req
      }
    })
    return Promise.resolve(['7za', 'butler'])
      .each((f) => ibrew.fetch(opts, f))
  })

  t.case('unknown formula', t => {
    return t.rejects(ibrew.fetch(opts, 'hidalgo'))
  })

  t.case('unstable update server', t => {
    t.stub(os, 'check_presence').resolves({parsed: '0.9'})
    t.stub(needle, 'get').callsArgWith(1, null, {statusCode: 503, body: 'Nope!'})
    return ibrew.fetch(opts, '7za')
  })

  t.case('check filters', t => {
    t.stub(os, 'platform').returns('linux')
    t.stub(os, 'check_presence').rejects('Boo')
    t.stub(needle, 'get').callsArgWith(1, null, {statusCode: 200, body: '1.0'})
    return t.rejects(ibrew.fetch(opts, '7za'))
  })
})
