
let test = require('zopf')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('Icon', t => {
  let Icon = proxyquire('../../app/components/icon', stubs)
  sd.shallowRender(sd(Icon, {}))
  let icon = 'boo'
  let tree = sd.shallowRender(sd(Icon, {icon}))
  t.ok(tree.findNode('.icon-boo'))
})
