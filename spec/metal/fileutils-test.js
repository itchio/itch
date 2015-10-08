import test from 'ava'
import {ext} from '../../metal/fileutils'

test('ext', t => {
  t.same(ext('path/to/some/file.zip'), '.zip')
  t.same(ext('path/to/some/file.ZIP'), '.zip')
  t.same(ext('path/to/some/file.tar.bz2'), '.bz2')
  t.end()
})
