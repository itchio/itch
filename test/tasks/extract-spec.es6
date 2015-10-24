import test from 'zopf'
import proxyquire from 'proxyquire'

import fixture from '../fixture'
import electron from '../stubs/electron'
import InstallStore from '../stubs/install-store'
import AppActions from '../stubs/app-actions'

let setup = (t) => {
  let sevenzip = {
    extract: () => 0,
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/install-store': InstallStore,
    '../actions/app-actions': AppActions,
    './extractors/7zip': sevenzip
  }, electron)
  let extract = proxyquire('../../app/tasks/extract', stubs)
  return {InstallStore, sevenzip, extract}
}

test('extract', t => {
  let {sevenzip, extract, InstallStore} = setup(t)

  ;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
    t.case(`use 7-zip on ${type}`, t => {
      t.mock(sevenzip).expects('extract').once().resolves()

      return extract.extract({
        archive_path: fixture.path(type),
        dest_path: '/tmp'
      })
    })
  })

  // 'empty' cannot be sniffed, 'png' can be sniffed but
  // isn't a valid archive type (hopefully)
  ;['empty', 'png'].forEach((type) => {
    t.case(`reject invalid archives (${type})`, t => {
      let spy = t.spy()
      let extract_opts = {
        archive_path: fixture.path(type),
        dest_path: '/tmp'
      }

      return extract.extract(extract_opts).catch(spy).finally(() => {
        t.ok(spy.calledWithMatch(/invalid archive/), 'archive rejected')
      })
    })
  })

  t.case(`validate upload_id`, t => {
    t.mock(InstallStore).expects('get_install').resolves({})
    return t.rejects(extract.start({id: 42}))
  })

  t.case(`task should start`, t => {
    t.mock(extract).expects('extract').resolves()
    return extract.start({id: 42})
  })
})
