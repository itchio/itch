import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'

let $ = require('react').createElement

test('forms', t => {
  let {InputRow} = proxyquire('../../app/components/forms', electron)

  let props = {
    autofocus: true,
    disabled: true,
    label: 'Al'
  }

  t.case('input row', t => {
    let tree = sd.shallowRender($(InputRow, props))

    let label = tree.subTree('label')
    t.ok(label)

    let legend = label.findNode('.label')
    t.ok(legend)
    t.is(legend.props.children, 'Al')

    let input = label.findNode('input')
    t.ok(input)
    t.ok(input.props.disabled)

    let instance = tree.getMountedInstance()
    let fake_input = {
      value: 'bozo',
      focus: () => null
    }
    // __proto__ is bad and I should feel bad but then again
    // refs is non-extensible... - amos
    instance.refs[`__proto__`].input = fake_input
    t.mock(fake_input).expects('focus').once()
    instance.componentDidMount()

    t.is(instance.value(), 'bozo')
  })
})
