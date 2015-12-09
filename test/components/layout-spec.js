'use nodent';'use strict'
import test from 'zopf'
import mori from 'mori'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'
import AppStore from '../stubs/app-store'
import defer from '../stubs/defer'

let $ = require('react').createElement

test('layout', t => {
  let stubs = Object.assign({
    '../stores/app-store': AppStore,
    '../util/defer': defer
  }, electron)
  let {Layout} = proxyquire('../../app/components/layout', stubs)
  let get_state = t.stub(AppStore, 'get_state')

  let set_state = (tree, props) => {
    get_state.returns(mori.toClj(props))
  }

  t.case('listeners', t => {
    let tree = sd.shallowRender($(Layout, {}))
    let instance = tree.getMountedInstance()
    instance.componentDidMount()
    AppStore.emit_change()
    instance.componentWillUnmount()

    t.is(get_state.callCount, 2)
  })

  t.case('setup', t => {
    let setup = {
      message: 'Checking dependencies',
      icon: 'settings',
      error: null
    }
    let props = {page: 'setup', setup}
    set_state(tree, props)

    let tree = sd.shallowRender($(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {state: mori.toClj(setup)})
  })

  t.case('login', t => {
    let login = {
      loading: true,
      errors: ['try again']
    }
    let props = {page: 'login', login}
    set_state(tree, props)

    let tree = sd.shallowRender($(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {state: mori.toClj(login)})
  })

  t.case('library', t => {
    let library = {
      games: [1, 2, 3]
    }
    let props = {page: 'library', library}
    set_state(tree, props)

    let tree = sd.shallowRender($(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {state: mori.toClj(library)})
  })
})
