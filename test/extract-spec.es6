import test from 'zopf'
import proxyquire from 'proxyquire'
import Promise from 'bluebird'
import assign from 'object-assign'

import install_store from './stubs/install-store'
import electron from './stubs/electron'

let setup = (t) => {
  let sevenzip = {
    extract: () => 0,
    '@noCallThru': true
  }

  let stubs = assign({
    '../stores/install-store': install_store,
    './extractors/7zip': sevenzip
  }, electron)
  let extract = proxyquire('../app/tasks/extract', stubs)
  return {install_store, sevenzip, extract}
}

test('extract', t => {
  ;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
    t.case(`use 7-zip on ${type}`, t => {
      let {sevenzip, extract} = setup(t)
      t.mock(sevenzip).expects('extract').once().returns(Promise.resolve())

      return extract.extract({
        archive_path: `${__dirname}/fixtures/${type}`,
        dest_path: '/tmp'
      })
    })
  })

  // 'empty' cannot be sniffed, 'png' can be sniffed but
  // isn't a valid archive type (hopefully)
  ;['empty', 'png'].forEach((type) => {
    t.case(`reject invalid archives (${type})`, t => {
      let {extract} = setup(t)
      let spy = t.spy()
      let extract_opts = {
        archive_path: `${__dirname}/fixtures/${type}`,
        dest_path: '/tmp'
      }

      return extract.extract(extract_opts).catch(spy).finally(() => {
        t.ok(spy.calledWithMatch(/invalid archive/), 'archive rejected')
      })
    })
  })

  t.case(`validate upload_id`, t => {
    let {extract, install_store} = setup(t)
    t.mock(install_store).expects('get_install').returns(Promise.resolve({}))

    return t.rejects(extract.start({id: 42}))
  })

  t.case(`task should start`, t => {
    let {extract} = setup(t)
    t.mock(extract).expects('extract').once()

    return extract.start({id: 42})
  })
})
