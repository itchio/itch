import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'
import AppStore from '../stubs/app-store'

let $ = require('react').createElement

test('layout', t => {
  t.stub(electron.remote, 'require').returns(AppStore)
  let {Layout} = proxyquire('../../app/components/layout', electron)

  let get_state = t.stub(AppStore, 'get_state')
  let set_state = (state) => {
    get_state.returns(JSON.stringify(state))
  }

  t.case('empty', t => {
    set_state({})
    let tree = sd.shallowRender($(Layout, {}))
    let instance = tree.getMountedInstance()
    t.stub(AppStore, 'add_change_listener').callsArgWith(1)
    instance.componentDidMount()
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
    set_state({ page: 'setup', setup })
    let tree = sd.shallowRender($(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, setup)
  })

  t.case('login', t => {
    let login = {
      loading: true,
      errors: ['try again']
    }
    set_state({ page: 'login', login })
    let tree = sd.shallowRender($(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, login)
  })

  t.case('library', t => {
    let library = {
      games: [1, 2, 3]
    }
    set_state({ page: 'library', library })
    let tree = sd.shallowRender($(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, library)
  })
})
