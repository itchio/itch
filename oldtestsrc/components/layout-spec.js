
import test from 'zopf'
import sd from './skin-deeper'

import ChromeStore from '../../app/stores/chrome-store'
import Layout from '../../app/components/layout'

test('layout', t => {
  const get_state = t.stub(ChromeStore, 'get_state').returns({})

  const set_state = (props) => {
    get_state.returns(props)
  }

  t.case('listeners', t => {
    const tree = sd.shallowRender(sd(Layout, {}))
    const instance = tree.getMountedInstance()
    t.is(get_state.callCount, 1, 'initializes state once')

    instance.componentDidMount()
    ChromeStore.emit_change({})
    instance.componentWillUnmount()
    t.is(get_state.callCount, 2, 'responds to state change')
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
