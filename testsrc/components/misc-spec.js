
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('misc', t => {
  t.case('Icon', t => {
    let Icon = proxyquire('../../app/components/icon', stubs)
    sd.shallowRender(sd(Icon, {}))
    let icon = 'boo'
    let tree = sd.shallowRender(sd(Icon, {icon}))
    t.ok(tree.findNode('.icon-boo'))
  })

  t.case('TaskIcon', t => {
    let TaskIcon = proxyquire('../../app/components/task-icon', stubs)
    let task = 'find-upload'
    let tree = sd.shallowRender(sd(TaskIcon, {task}))
    let Icon
    t.ok(Icon = tree.findNode('Icon'))
    t.is(Icon.props.icon, 'stopwatch')
  })

  t.case('ProgressBar', t => {
    let ProgressBar = proxyquire('../../app/components/progress-bar', stubs)
    sd.shallowRender(sd(ProgressBar, {}))
    let progress = 0.5
    let tree = sd.shallowRender(sd(ProgressBar, {progress}))
    let inner = tree.findNode('.progress_inner')
    t.is(inner.props.style.width, '50%')
  })

  t.case('ErrorList', t => {
    let ErrorList = proxyquire('../../app/components/error-list', stubs)
    sd.shallowRender(sd(ErrorList, {errors: null}))
    sd.shallowRender(sd(ErrorList, {errors: 'uh oh'}))
    sd.shallowRender(sd(ErrorList, {errors: ['eenie', 'meenie']}))
  })
})
