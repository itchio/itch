
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('layout', t => {
  const Layout = proxyquire('../../app/components/layout', stubs).default
  const get_state = t.stub(stubs.AppStore, 'get_state').returns({})

  const set_state = (props) => {
    get_state.returns(props)
  }

  t.case('listeners', t => {
    const tree = sd.shallowRender(sd(Layout, {}))
    const instance = tree.getMountedInstance()
    instance.componentDidMount()
    stubs.AppStore.emit_change({})
    instance.componentWillUnmount()

    t.is(get_state.callCount, 1)
  })

  t.case('login', t => {
    const login = {
      loading: true,
      errors: ['try again']
    }
    const props = {page: 'login', login}
    set_state(props)

    const tree = sd.shallowRender(sd(Layout, {}))
    const vdom = tree.getRenderOutput()
    t.same(vdom.props, {children: undefined, state: {page: 'login', login}})
  })

  t.case('library', t => {
    const library = {
      games: [1, 2, 3]
    }
    const props = {page: 'library', library}
    set_state(props)

    const tree = sd.shallowRender(sd(Layout, {}))
    const vdom = tree.getRenderOutput()
    t.same(vdom.props, {children: undefined, state: props})
  })
})
