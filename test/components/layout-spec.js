
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('layout', t => {
  let Layout = proxyquire('../../app/components/layout', stubs)
  let get_state = t.stub(stubs.AppStore, 'get_state')

  let set_state = (props) => {
    get_state.returns(mori.toClj(props))
  }

  t.case('listeners', t => {
    let tree = sd.shallowRender(sd(Layout, {}))
    let instance = tree.getMountedInstance()
    instance.componentDidMount()
    stubs.AppStore.emit_change()
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
    set_state(props)

    let tree = sd.shallowRender(sd(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {children: undefined, state: mori.toClj({page: 'setup', setup})})
  })

  t.case('login', t => {
    let login = {
      loading: true,
      errors: ['try again']
    }
    let props = {page: 'login', login}
    set_state(props)

    let tree = sd.shallowRender(sd(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {children: undefined, state: mori.toClj({page: 'login', login})})
  })

  t.case('library', t => {
    let library = {
      games: [1, 2, 3]
    }
    let props = {page: 'library', library}
    set_state(props)

    let tree = sd.shallowRender(sd(Layout, {}))
    let vdom = tree.getRenderOutput()
    t.same(vdom.props, {children: undefined, state: mori.toClj(library), update: null})
  })
})
