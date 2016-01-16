
let test = require('zopf')
let proxyquire = require('proxyquire')
let Promise = require('bluebird')
let PassThrough = require('stream').PassThrough

let electron = require('../stubs/electron')
let log = require('../../app/util/log')

test('ibrew', t => {
  let opts = {
    onstatus: (msg) => console.log(msg),
    logger: new log.Logger()
  }
  let os = {
    platform: () => 'win32',
    arch: () => 'x64',
    assert_presence: async () => ({parsed: '9.20'}),
    '@global': true
  }
  let needle = {
    get: () => Promise.reject(),
    defaults: () => null,
    '@global': true,
    '@noCallThru': true
  }
  let sf = {
    createWriteStream: () => {
      let pt = new PassThrough()
      pt.on('data', () => null)
      return pt
    },
    '@global': true
  }
  let extract = {
    extract: () => Promise.resolve()
  }
  let stubs = Object.assign({
    'needle': needle,
    './sf': sf,
    '../sf': sf,
    './os': os,
    '../os': os,
    './extract': extract
  }, electron)
  let ibrew = proxyquire('../../app/util/ibrew', stubs)

  let net_stubs = {
    'needle': needle,
    '../os': os
  }
  let net = proxyquire('../../app/util/ibrew/net', net_stubs)

  let formulas_stubs = {
    '../os': os
  }
  let formulas = proxyquire('../../app/util/ibrew/formulas', formulas_stubs)

  let version = require('../../app/util/ibrew/version')

  t.case('compares versions', t => {
    t.ok(version.equal('v1.23', '1.23'), 'equal versions')
    t.notOk(version.equal('v1.23', 'v1.24'), 'unequal versions')
  })

  t.case('os / arch', t => {
    t.is('windows', net.os())
    t.is('amd64', net.arch())
    t.stub(os, 'platform').returns('linux')
    t.stub(os, 'arch').returns('ia32')
    t.is('linux', net.os())
    t.is('386', net.arch())
    os.arch.returns('armv7')
    t.is('unknown', net.arch())
  })

  t.case('archive_name', t => {
    t.is('butler.7z', ibrew.archive_name('butler'))
    t.is('7za.exe', ibrew.archive_name('7za'))
    t.stub(os, 'platform').returns('linux')
    t.is('7za', ibrew.archive_name('7za'))
    formulas.namaste = {format: 'A4'}
    t.throws(() => ibrew.archive_name('namaste'))
  })

  t.case('with all deps', t => {
    t.stub(os, 'assert_presence').resolves({parsed: '1.0'})
    t.stub(needle, 'get').callsArgWith(1, null, {statusCode: 200, body: '1.0'})
    let opts = {}
    return Promise.resolve(['7za', 'butler'])
      .each((f) => ibrew.fetch(opts, f))
  })

  t.case('without all deps', t => {
    let check = t.stub(os, 'assert_presence')
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

  t.case('unknown formula', async t => {
    let err
    try {
      await ibrew.fetch(opts, 'hidalgo')
    } catch (e) { err = e }
    t.ok(err, 'did throw')
  })

  t.case('unstable update server', async t => {
    t.stub(os, 'assert_presence').resolves({parsed: '0.9'})
    t.stub(needle, 'get').callsArgWith(1, null, {statusCode: 503, body: 'Nope!'})
    await ibrew.fetch(opts, '7za')
  })

  t.case('check filters', async t => {
    t.stub(os, 'platform').returns('linux')
    t.stub(os, 'assert_presence').rejects('Boo')
    t.stub(needle, 'get').callsArgWith(1, null, {statusCode: 200, body: '1.0'})

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
