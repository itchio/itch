import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'

import sevenzip from '../../metal/tasks/extractors/7zip'
import extractor from '../../metal/tasks/extract'

let files = ['zip', 'gz', 'bz2', '7z']

for (let file of files) {
  test.serial(`should use 7-zip extractor for ${file} files`, t => {
    let mock = sinon.mock(sevenzip)
    mock.expects('extract').once().returns(Promise.resolve())
    return extractor.extract({
      archive_path: `${__dirname}/fixtures/${file}`,
      dest_path: '/tmp'
    }).finally(() => {
      mock.verify()
    })
  })
}
