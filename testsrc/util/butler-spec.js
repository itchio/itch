
import test from 'zopf'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

test('http', t => {
  const onprogress = t.spy()
  const http_opts = {
    url: 'http://-invalid/hello.txt',
    dest: '/dev/null',
    onprogress
  }

  const spawn = test.module(t.stub().resolves(42))
  const stubs = {
    './spawn': spawn
  }
  const butler = proxyquire('../../app/util/butler', stubs).default

  t.case('spawns butler', async t => {
    const r = await butler.dl(http_opts)
    sinon.assert.calledOnce(spawn)
    t.is(r, 42)

    const ontoken = spawn.getCall(0).args[0].ontoken
    ontoken(JSON.stringify({type: 'progress', percentage: 45.12}))
    sinon.assert.calledWith(onprogress, {percent: 45.12})
  })
})
