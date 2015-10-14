import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

import app_store from './stubs/app-store'
import install_store from './stubs/install-store'
import electron from './stubs/electron'

let setup = (t) => {
  let http = {
    request: () => null
  }

  let stubs = assign({
    '../stores/install-store': install_store,
    '../stores/app-store': app_store,
    '../util/http': http
  }, electron)

  let download = proxyquire('../app/tasks/download', stubs)
  return {download}
}

test('download validates upload_id', t => {
  let {download} = setup(t)
  return t.rejects(download.start({id: 42}))
})

test('download downloads free game', t => {
  let {download} = setup(t)
  t.stub(install_store, 'get_install').returns(Promise.resolve({
    upload_id: 11,
    uploads: {
      '11': {
        id: 11,
        size: 512
      }
    }
  }))
  t.stub(app_store.get_current_user(), 'download_upload').returns(Promise.resolve({
    url: 'http://example.org/game.zip'
  }))
  return download.start({id: 42})
})

test('download downloads paid game', t => {
  let {download} = setup(t)
  t.stub(install_store, 'get_install').returns(Promise.resolve({
    upload_id: 11,
    uploads: {
      '11': {
        id: 11,
        size: 512
      }
    },
    key: {id: 'abacus'}
  }))
  t.stub(app_store.get_current_user(), 'download_upload_with_key').returns(Promise.resolve({
    url: 'http://example.org/game.zip'
  }))
  return download.start({id: 42})
})
