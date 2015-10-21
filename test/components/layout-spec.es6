import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'

let $ = require('react').createElement

test('layout', t => {
  let {Layout} = proxyquire('../../app/components/layout', electron)

  t.case('empty', t => {
    let tree = sd.shallowRender($(Layout, {}))
    let instance = tree.getMountedInstance()
    instance.componentDidMount()
    electron.ipc.send('app-store-change', {})
    instance.stateArrived({ page: 'login', login: {a: 'b'} }, 0)
    instance.componentWillUnmount()
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {})
  })

  t.case('setup', t => {
    let setup = {
      message: 'Checking dependencies',
      icon: 'settings',
      error: null
    }
    let tree = sd.shallowRender($(Layout, {}))
    let instance = tree.getMountedInstance()
    instance.stateArrived({ page: 'setup', setup }, 2)
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, setup)
  })

  t.case('login', t => {
    let login = {
      loading: true,
      errors: ['try again']
    }
    let tree = sd.shallowRender($(Layout, {}))
    let instance = tree.getMountedInstance()
    instance.stateArrived({ page: 'login', login }, 2)
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, login)
  })

  t.case('library', t => {
    let library = {
      games: [1, 2, 3]
    }
    let tree = sd.shallowRender($(Layout, {}))
    let instance = tree.getMountedInstance()
    instance.stateArrived({ page: 'library', library }, 2)
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, library)
  })
})
