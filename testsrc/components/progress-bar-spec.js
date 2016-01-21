
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('ProgressBar', t => {
  let ProgressBar = proxyquire('../../app/components/progress-bar', stubs)
  sd.shallowRender(sd(ProgressBar, {}))
  let progress = 0.5
  let tree = sd.shallowRender(sd(ProgressBar, {progress}))
  let inner = tree.findNode('.progress_inner')
  t.is(inner.props.style.width, '50%')
})
