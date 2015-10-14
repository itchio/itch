import test from 'zopf'
import proxyquire from 'proxyquire'
import Promise from 'bluebird'
import assign from 'object-assign'

proxyquire.noPreserveCache()

let setup = (t) => {
  let sevenzip = {
    extract: () => 0,
    '@noCallThru': true
  }

  let install_store = proxyquire('./stubs/install-store', {})

  let stubs = assign({
    '../stores/install_store': install_store,
    './extractors/7zip': sevenzip
  }, proxyquire('./stubs/electron', {}))
  let extract = proxyquire('../app/tasks/extract', stubs)
  return {install_store, sevenzip, extract}
}

;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
  test(`extract uses 7-zip on ${type}`, t => {
    if (true) return
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
  test(`extract rejects invalid archives (${type})`, t => {
    if (true) return
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

test(`extract validates upload_id`, t => {
  let {extract, install_store} = setup(t)
  let spy = t.spy()
  t.mock(install_store).expects('get_install').returns(Promise.resolve({}))

  return extract.start({id: 42}).catch(spy).finally(() => {
    t.ok(spy.calledOnce)
  })
})

test(`extract task should call subroutine`, t => {
  let {extract} = setup(t)
  t.mock(extract).expects('extract')
  return extract.start({id: 42})
})
