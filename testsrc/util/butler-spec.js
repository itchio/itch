
import test from 'zopf'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

test('http', t => {
  const onProgress = t.spy()
  const httpOpts = {
    url: 'http://-invalid/hello.txt',
    dest: '/dev/null',
    onProgress
  }

  const spawn = test.module(t.stub().resolves(42))
  const stubs = {
    './spawn': spawn
  }
  const butler = proxyquire('../../app/util/butler', stubs).default

  t.case('spawns butler', async t => {
    const r = await butler.dl(httpOpts)
    sinon.assert.calledOnce(spawn)
    t.is(r, 42)

    const onToken = spawn.getCall(0).args[0].onToken
    onToken(JSON.stringify({type: 'progress', percentage: 45.12}))
    sinon.assert.calledWith(onProgress, {percent: 45.12})
  })
})
