import test from 'tape'
import sinon from 'sinon'
import mock from 'mock-require'
import Promise from 'bluebird'

mock('../../metal/stores/install_store', {})

let sevenzip = require('../../metal/tasks/extractors/7zip')
let extractor = require('../../metal/tasks/extract')

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
