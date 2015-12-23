
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')
let CredentialsStore = require('../stubs/credentials-store')

test('user-panel', t => {
  t.stub(stubs.electron.remote, 'require', () => CredentialsStore)
  let UserPanel = proxyquire('../../app/components/user-panel', stubs).UserPanel

  t.case('UserPanel (loading)', t => {
    t.stub(CredentialsStore, 'get_me').returns(null)
    sd.shallowRender(sd(UserPanel, {}))
  })

  t.case('UserPanel (loaded)', t => {
    t.stub(CredentialsStore, 'get_me').returns({
      cover_url: 'https://example.org/img.png',
      username: 'toto'
    })
    let tree = sd.shallowRender(sd(UserPanel, {}))
    let instance = tree.getMountedInstance()
    let mock = t.mock(CredentialsStore)
    mock.expects('add_change_listener').callsArg(1)
    instance.componentDidMount()
    mock.expects('remove_change_listener')
    instance.componentWillUnmount()
  })
})
