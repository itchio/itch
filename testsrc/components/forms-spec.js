
import test from 'zopf'
import sd from './skin-deeper'

import InputRow from '../../app/components/input-row'
import SelectRow from '../../app/components/select-row'

test('forms', t => {
  t.case('InputRow', t => {
    const props = {
      autofocus: true,
      disabled: true,
      name: 'al'
    }

    const tree = sd.shallowRender(sd(InputRow, props))

    const label = tree.subTree('label')
    t.ok(label)

    const input = label.findNode('input')
    t.ok(input)
    t.ok(input.props.disabled)
    t.is(input.props.placeholder, props.name)

    const instance = tree.getMountedInstance()
    const fake_input = {
      value: 'bozo',
      focus: () => null
    }
    // __proto__ is bad and I should feel bad but then again
    // refs is non-extensible... - amos
    instance.refs[`__proto__`].input = fake_input
    t.mock(fake_input).expects('focus').once()
    instance.componentDidMount()

    t.is(instance.value(), 'bozo')
    delete instance.refs[`__proto__`].input
  })

  t.case('SelectRow', t => {
    const props = {
      label: 'FCC',
      options: [
        {value: 1, label: 'No showboating'},
        {value: 2, label: 'Shipoopi'}
      ]
    }
    sd.shallowRender(sd(SelectRow, props))
  })
})
