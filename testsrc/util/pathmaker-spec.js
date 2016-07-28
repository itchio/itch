
import ospath from 'path'
import test from 'zopf'
import pathmaker from '../../app/util/pathmaker'
import {app} from '../../app/electron'

test('pathmaker', t => {
  t.case('downloadPath', t => {
    t.same(pathmaker.downloadPath({
      filename: 'voices.tar.gz',
      id: 1990
    }), ospath.join(app.getPath('userData'), 'downloads', '1990.tar.gz'))
    t.same(pathmaker.downloadPath({
      filename: 'FACES OF WRATH.TAR.BZ2',
      id: 1997
    }), ospath.join(app.getPath('userData'), 'downloads', '1997.tar.bz2'))
    t.same(pathmaker.downloadPath({
      filename: '2019.07.21.zip',
      id: 1990
    }), ospath.join(app.getPath('userData'), 'downloads', '1990.zip'))
    t.same(pathmaker.downloadPath({
      filename: 'the-elusive-extless-file',
      id: 1994
    }), ospath.join(app.getPath('userData'), 'downloads', '1994'))
  })
})
