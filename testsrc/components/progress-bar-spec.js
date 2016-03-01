
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('ProgressBar', t => {
  let ProgressBar = proxyquire('../../app/components/progress-bar', stubs)
  sd.shallowRender(sd(ProgressBar, {}))
  let progress = 0.5
  let tree = sd.shallowRender(sd(ProgressBar, {progress}))
  let inner = tree.findNode('.progress_inner')
  t.is(inner.props.style.width, '50%')
})
