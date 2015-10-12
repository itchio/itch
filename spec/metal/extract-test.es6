import test from 'tape-catch'
import sinon from 'sinon'
import mock from 'mock-require'
import Promise from 'bluebird'

let noop = require('../../metal/util/noop')

let InstallStore = {
  get_install: () => Promise.resolve({upload_id: 42}),
  archive_path: () => '/tmp/archive',
  app_path: () => '/tmp/app'
}
mock('../../metal/stores/install_store', InstallStore)

let sevenzip = require('../../metal/tasks/extractors/7zip')
let errors = require('../../metal/tasks/errors')
let extract = require('../../metal/tasks/extract')

let Logger = require('../../metal/util/log').Logger

mock.stopAll()

let files = ['zip', 'gz', 'bz2', '7z']

for (let file of files) {
  test(`extract ${file} with 7-zip`, t => {
    let mock = sinon.mock(sevenzip)
    mock.expects('extract').once().returns(Promise.resolve())
    extract.extract({
      archive_path: `${__dirname}/fixtures/${file}`,
      dest_path: '/tmp'
    }).finally(() => {
      mock.verify()
      t.end()
    })
  })
}

// 'empty' cannot be sniffed, 'png' can be sniffed but
// isn't a valid archive type (hopefully)
;['empty', 'png'].forEach((type) => {
  test(`reject invalid archives (${type})`, t => {
    t.plan(1)
    let spy = sinon.spy()
    let extract_opts = {
      archive_path: `${__dirname}/fixtures/${type}`,
      dest_path: '/tmp'
    }

    extract.extract(extract_opts).catch(spy).finally(() => {
      t.ok(spy.calledWithMatch(/invalid archive/), 'archive rejected')
    })
  })
})

let logger = new Logger()
let opts = {id: 42, logger}

test(`should transition away if missing upload_id`, function (t) {
  let spy = sinon.spy()
  let mock = sinon.mock(InstallStore)
  mock.expects('get_install').returns(Promise.resolve({}))

  extract.start(opts).catch(spy).finally(() => {
    let matcher = sinon.match.instanceOf(errors.Transition)
      .and(sinon.match({to: 'find_upload'}))
    sinon.assert.calledWith(spy, matcher)
    mock.verify()
    t.end()
  })
})

test(`should call subroutine`, function (t) {
  let mock = sinon.mock(extract)
  mock.expects('extract')

  extract.start(opts).then(() => {
    mock.verify()
    t.end()
  })
})
