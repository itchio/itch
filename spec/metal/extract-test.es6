import test from 'tape'
import sinon from 'sinon'
import mock from 'mock-require'
import Promise from 'bluebird'

let noop = require('../../metal/util/noop')

let InstallStore = {
  get_install: noop
}
mock('../../metal/stores/install_store', InstallStore)

let sevenzip = require('../../metal/tasks/extractors/7zip')
let errors = require('../../metal/tasks/errors')
let extractor = require('../../metal/tasks/extract')

let Logger = require('../../metal/util/log').Logger

mock.stopAll()

let files = ['zip', 'gz', 'bz2', '7z']

for (let file of files) {
  test(`should use 7-zip extractor for ${file} files`, t => {
    let mock = sinon.mock(sevenzip)
    mock.expects('extract').once().returns(Promise.resolve())
    extractor.extract({
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
  test(`should reject archives we don't know how to extract (${type})`, t => {
    t.plan(1)
    let spy = sinon.spy()
    let extract_opts = {
      archive_path: `${__dirname}/fixtures/${type}`,
      dest_path: '/tmp'
    }

    extractor.extract(extract_opts).catch(spy).finally(() => {
      t.ok(spy.calledWithMatch(/invalid archive/), 'archive rejected')
    })
  })
})

let logger = new Logger()
let opts = {id: 42, logger}

test(`should transition away if missing upload_id`, sinon.test(function (t) {
  t.plan(1)
  let spy = this.spy()
  let mock = this.mock(InstallStore)
  mock.expects('get_install').returns(Promise.resolve({}))

  extractor.start(opts).catch(spy).finally(() => {
    t.ok(spy.calledWith(sinon.match.instanceOf(errors.Transition)))
  })
}))
