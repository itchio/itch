

const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('forms', t => {
  t.case('InputRow', t => {
    let InputRow = proxyquire('../../app/components/input-row', stubs)
    let props = {
      autofocus: true,
      disabled: true,
      name: 'al'
    }

    let tree = sd.shallowRender(sd(InputRow, props))

    let label = tree.subTree('label')
    t.ok(label)

    let input = label.findNode('input')
    t.ok(input)
    t.ok(input.props.disabled)
    t.is(input.props.placeholder, props.name)

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
    delete instance.refs[`__proto__`].input
  })

  t.case('SelectRow', t => {
    let SelectRow = proxyquire('../../app/components/select-row', stubs)
    let props = {
      label: 'FCC',
      options: [
        {value: 1, label: 'No showboating'},
        {value: 2, label: 'Shipoopi'}
      ]
    }
    sd.shallowRender(sd(SelectRow, props))
  })
})
