import test from 'zopf'
import proxyquire from 'proxyquire'

import fixture from '../fixture'
import install_store from '../stubs/install-store'
import electron from '../stubs/electron'

let setup = (t) => {
  let sevenzip = {
    extract: () => 0,
    '@noCallThru': true
  }

  let stubs = Object.assign({
    '../stores/install-store': install_store,
    './extractors/7zip': sevenzip
  }, electron)
  let extract = proxyquire('../../app/tasks/extract', stubs)
  return {install_store, sevenzip, extract}
}

test('extract', t => {
  let {sevenzip, extract, install_store} = setup(t)

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
    t.mock(install_store).expects('get_install').resolves({})
    return t.rejects(extract.start({id: 42}))
  })

  t.case(`task should start`, t => {
    t.mock(extract).expects('extract').once()

    return extract.start({id: 42})
  })
})
