
const test = require('zopf')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const electron = require('../stubs/electron')

test('http', t => {
  let onprogress = t.spy()
  let http_opts = {
    url: 'http://-invalid/hello.txt',
    dest: '/dev/null',
    onprogress
  }

  let spawn = t.stub().resolves(42)
  let stubs = Object.assign({
    './spawn': spawn
  }, electron)

  let butler = proxyquire('../../app/util/butler', stubs)

  t.case('spawns butler', async t => {
    let r = await butler.dl(http_opts)
    sinon.assert.calledOnce(spawn)
    t.is(r, 42)

    let ontoken = spawn.getCall(0).args[0].ontoken
    ontoken(JSON.stringify({type: 'progress', percentage: 45.12}))
    sinon.assert.calledWith(onprogress, {percent: 45.12})
  })
})
