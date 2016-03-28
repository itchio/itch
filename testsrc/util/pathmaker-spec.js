
import path from 'path'
import test from 'zopf'
import pathmaker from '../../app/util/pathmaker'
import {app} from '../../app/electron'

test('pathmaker', t => {
  t.case('downloadPath', t => {
    t.same(pathmaker.downloadPath({
      filename: '2019.07.21.zip',
      id: 1990
    }), path.join(app.getPath('userData'), 'downloads', '1990.zip'))
    t.same(pathmaker.downloadPath({
      filename: 'the-elusive-extless-file',
      id: 1994
    }), path.join(app.getPath('userData'), 'downloads', '1994'))
  })
})
