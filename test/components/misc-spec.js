'use nodent';'use strict'
let test = require('zopf')
let proxyquire = require('proxyquire')
let sd = require('skin-deep')

let electron = require('../stubs/electron')

let $ = require('react').createElement

test('user-panel', t => {
  let misc = proxyquire('../../app/components/misc', electron)
  let Icon = misc.Icon
  let TaskIcon = misc.TaskIcon
  let ProgressBar = misc.ProgressBar
  let ErrorList = misc.ErrorList

  t.case('Icon', t => {
    sd.shallowRender($(Icon, {}))
    let icon = 'boo'
    let tree = sd.shallowRender($(Icon, {icon}))
    t.ok(tree.findNode('.icon-boo'))
  })

  t.case('TaskIcon', t => {
    let task = 'find-upload'
    let tree = sd.shallowRender($(TaskIcon, {task}))
    let Icon
    t.ok(Icon = tree.findNode('Icon'))
    t.is(Icon.props.icon, 'stopwatch')
  })

  t.case('ProgressBar', t => {
    sd.shallowRender($(ProgressBar, {}))
    let progress = 0.5
    let tree = sd.shallowRender($(ProgressBar, {progress}))
    let inner = tree.findNode('.progress_inner')
    t.is(inner.props.style.width, '50%')
  })

  t.case('ErrorList', t => {
    sd.shallowRender($(ErrorList, {errors: null}))
    sd.shallowRender($(ErrorList, {errors: 'uh oh'}))
    sd.shallowRender($(ErrorList, {errors: ['eenie', 'meenie']}))
  })
})
