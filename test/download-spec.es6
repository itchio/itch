import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

import install_store from './stubs/install-store'
import electron from './stubs/electron'

let setup = (t) => {
  let stubs = assign({
    '../stores/install_store': install_store
  }, electron)

  let download = proxyquire('../app/tasks/download', stubs)
  return {download}
}

test('download validates upload_id', t => {
  let {download} = setup(t)
  return t.rejects(download.start({id: 42}))
})
