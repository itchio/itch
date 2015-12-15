

let test = require('zopf')
let proxyquire = require('proxyquire')
let sinon = require('sinon')

let electron = require('../stubs/electron')

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

  let http = proxyquire('../../app/util/http', stubs)

  t.case('spawns butler', async t => {
    let r = await http.request(http_opts)
    sinon.assert.calledOnce(spawn)
    t.is(r, 42)

    let ontoken = spawn.getCall(0).args[0].ontoken
    ontoken(JSON.stringify({type: 'progress', percentage: 45.12}))
    sinon.assert.calledWith(onprogress, {percent: 45.12})
  })
})
