
const test = require('zopf')
const proxyquire = require('proxyquire')

const sd = require('./skin-deeper')
const stubs = require('../stubs/react-stubs')

test('Icon', t => {
  let Icon = proxyquire('../../app/components/icon', stubs)
  sd.shallowRender(sd(Icon, {}))
  let icon = 'boo'
  let tree = sd.shallowRender(sd(Icon, {icon}))
  t.ok(tree.findNode('.icon-boo'))
})
