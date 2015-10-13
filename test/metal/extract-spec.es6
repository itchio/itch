import test from 'zopf'
import proxyquire from 'proxyquire'
import Promise from 'bluebird'

let setup = (t) => {
  let install_store = {
    get_install: () => Promise.resolve({upload_id: 42}),
    archive_path: () => '/tmp/archive',
    app_path: () => '/tmp/app',
    '@noCallThru': true
  }

  let sevenzip = {
    extract: () => 0,
    '@noCallThru': true
  }

  let extract = proxyquire('../../app/tasks/extract', {
    '../stores/install_store': install_store,
    './extractors/7zip': sevenzip
  })
  return {install_store, sevenzip, extract}
}

;['zip', 'gz', 'bz2', '7z'].forEach((type) => {
  test(`extract ${type} with 7-zip`, t => {
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
  test(`reject invalid archives (${type})`, t => {
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

test(`should transition away if missing upload_id`, t => {
  let {extract, install_store} = setup(t)
  let spy = t.spy()
  t.mock(install_store).expects('get_install').returns(Promise.resolve({}))

  return extract.start({id: 42}).catch(spy).finally(() => {
    t.ok(spy.calledOnce)
  })
})

test.serial(`extract task should call subroutine`, t => {
  let {extract} = setup(t)
  t.mock(extract).expects('extract')
  return extract.start({id: 42})
})
