
import test from 'zopf'
import proxyquire from 'proxyquire'
import {PassThrough} from 'stream'

import electron from '../stubs/electron'
import log from '../../app/util/log'

import version from '../../app/util/ibrew/version'

test('ibrew', t => {
  const opts = {
    onstatus: (msg) => console.log(msg),
    logger: new log.Logger()
  }

  const os = {
    __esModule: true,
    default: {
      platform: () => 'win32',
      arch: () => 'x64',
      assert_presence: async () => ({parsed: '9.20'}),
      in_browser: () => true
    },
    '@global': true
  }
  const needle = {
    __esModule: true,
    default: {
      get: async () => { throw new Error('stub') },
      defaults: () => null
    },
    '@global': true,
    '@noCallThru': true
  }
  const sf = {
    __esModule: true,
    default: {
      mkdir: async () => null,
      promised: async() => null,
      createWriteStream: () => {
        let pt = new PassThrough()
        pt.on('data', () => null)
        return pt
      }
    },
    '@global': true
  }
  const extract = {
    __esModule: true,
    default: {
      extract: async () => null
    }
  }
  const stubs = Object.assign({
    'needle': needle,
    './sf': sf,
    '../sf': sf,
    './os': os,
    '../os': os,
    './extract': extract
  }, electron)
  const ibrew = proxyquire('../../app/util/ibrew', stubs).default

  const net_stubs = Object.assign({
    'needle': needle,
    '../os': os
  }, electron)
  const net = proxyquire('../../app/util/ibrew/net', net_stubs).default

  let formulas_stubs = {
    '../os': os
  }
  let formulas = proxyquire('../../app/util/ibrew/formulas', formulas_stubs).default

  t.case('compares versions', t => {
    t.ok(version.equal('v1.23', '1.23'), 'equal versions')
    t.notOk(version.equal('v1.23', 'v1.24'), 'unequal versions')
  })

  t.case('os / arch', t => {
    t.is('windows', net.os())
    t.is('amd64', net.arch())
    t.stub(os.default, 'platform').returns('linux')
    t.stub(os.default, 'arch').returns('ia32')
    t.is('linux', net.os())
    t.is('386', net.arch())
    os.default.arch.returns('armv7')
    t.is('unknown', net.arch())
  })

  t.case('archive_name', t => {
    t.is('butler.7z', ibrew.archive_name('butler'))
    t.is('7za.exe', ibrew.archive_name('7za'))
    t.stub(os.default, 'platform').returns('linux')
    t.is('7za', ibrew.archive_name('7za'))
    formulas.namaste = {format: 'A4'}
    t.throws(() => ibrew.archive_name('namaste'))
  })

  t.case('with all deps', async t => {
    t.stub(os.default, 'assert_presence').resolves({parsed: '1.0'})
    t.stub(needle.default, 'get').callsArgWith(1, null, {statusCode: 200, body: '1.0'})
    let opts = {}

    await ibrew.fetch(opts, '7za')
    await ibrew.fetch(opts, 'butler')
  })

  t.case('without all deps', async t => {
    let check = t.stub(os.default, 'assert_presence')
    check.onCall(0).rejects('nope!')
    check.onCall(1).resolves({parsed: '0.8'})

    t.stub(needle.default, 'get', function (url, cb) {
      if (cb) {
        cb(null, {statusCode: 200, body: '1.0'})
      } else {
        return {
          pipe: (sink) => setImmediate(() => sink.emit('close')),
          on: () => null
        }
      }
    })

    await ibrew.fetch(opts, '7za')
    await ibrew.fetch(opts, 'butler')
  })

  t.case('unknown formula', async t => {
    let err
    try {
      await ibrew.fetch(opts, 'hidalgo')
    } catch (e) { err = e }
    t.ok(err, 'did throw')
  })

  t.case('unstable update server', async t => {
    t.stub(os.default, 'assert_presence').resolves({parsed: '0.9'})
    t.stub(needle.default, 'get').callsArgWith(1, null, {statusCode: 503, body: 'Nope!'})
    await ibrew.fetch(opts, '7za')
  })

  t.case('check filters', async t => {
    t.stub(os.default, 'platform').returns('linux')
    t.stub(os.default, 'assert_presence').rejects('Boo')
    t.stub(needle.default, 'get').callsArgWith(1, null, {statusCode: 200, body: '1.0'})

    let err
    try {
      await ibrew.fetch(opts, '7za')
    } catch (e) { err = e }
    t.ok(err, 'did throw')
  })

  t.case('7za version parsing', t => {
    let cases = {
      // Windows 32-bit (7zip.org download)
      '7-Zip (a) [32] 15.14 : Copyright (c) 1999-2015 Igor Pavlov : 2015-12-31': '15.14',
      // Windows 64-bit (msys2)
      '7-Zip (a) 9.38 beta  Copyright (c) 1999-2014 Igor Pavlov  2015-01-03': '9.38',
      // OSX 64-bit, Ubuntu 64-bit
      '7-Zip (A) [64] 9.20  Copyright (c) 1999-2010 Igor Pavlov  2010-11-18': '9.20'
    }

    let parser = formulas['7za'].version_check.parser
    for (let k of Object.keys(cases)) {
      let expected_version = cases[k]
      let parsed_version = parser.exec(k)[1]
      t.is(parsed_version, expected_version, `parses version ${expected_version}`)
    }
  })
})
