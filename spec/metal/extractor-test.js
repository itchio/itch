import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'

import extractor from '../../metal/extractor'
import sevenzip from '../../metal/extractors/7zip'

let files = ['zip', 'gz', 'bz2', '7z']

for (let file of files) {
  test(`should use 7-zip extractor for ${file} files`, sinon.test(function (t) {
    this.mock(sevenzip).expects('extract').once().returns(Promise.resolve())
    extractor.extract({
      archive_path: `${__dirname}/fixtures/${file}`,
      dest_path: '/tmp'
    }).finally(() => {
      t.end()
    })
  }))
}
