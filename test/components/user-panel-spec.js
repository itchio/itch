import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'
import CredentialsStore from '../stubs/credentials-store'

let $ = require('react').createElement

test('user-panel', t => {
  t.stub(electron.remote, 'require').returns(CredentialsStore)
  let {UserPanel} = proxyquire('../../app/components/user-panel', electron)

  t.case('UserPanel (loading)', t => {
    t.stub(CredentialsStore, 'get_me').returns(null)
    sd.shallowRender($(UserPanel, {}))
  })

  t.case('UserPanel (loaded)', t => {
    t.stub(CredentialsStore, 'get_me').returns({
      cover_url: 'https://example.org/img.png',
      username: 'toto'
    })
    let tree = sd.shallowRender($(UserPanel, {}))
    let instance = tree.getMountedInstance()
    let mock = t.mock(CredentialsStore)
    mock.expects('add_change_listener').callsArg(1)
    instance.componentDidMount()
    mock.expects('remove_change_listener')
    instance.componentWillUnmount()
  })
})
