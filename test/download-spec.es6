import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

proxyquire.noPreserveCache()

let setup = (t) => {
  let install_store = proxyquire('./stubs/install-store', {})

  let stubs = assign({
    '../stores/install_store': install_store
  }, proxyquire('./stubs/electron', {}))

  let download = proxyquire('../app/tasks/download', stubs)
  return {download}
}

test('download validates upload_id', t => {
  let {download} = setup(t)
  return t.rejects(download.start({id: 42}))
})
