
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('TaskIcon', t => {
  let TaskIcon = proxyquire('../../app/components/task-icon', stubs)
  let task = 'find-upload'
  let tree = sd.shallowRender(sd(TaskIcon, {task}))
  let Icon
  t.ok(Icon = tree.findNode('Icon'))
  t.is(Icon.props.icon, 'stopwatch')
})
