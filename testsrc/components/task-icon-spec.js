
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('TaskIcon', t => {
  let TaskIcon = proxyquire('../../app/components/task-icon', stubs)
  let task = 'find-upload'
  let tree = sd.shallowRender(sd(TaskIcon, {task}))
  let Icon
  t.ok(Icon = tree.findNode('Icon'))
  t.is(Icon.props.icon, 'stopwatch')
})
