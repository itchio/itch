
import test from 'zopf'
import proxyquire from 'proxyquire'

test('config', t => {
  const nconf = test.module({
    file: () => null,
    get: () => null,
    set: () => null,
    clear: () => null,
    save: () => null
  })
  t.stub(nconf, 'file').throws()

  const config = proxyquire('../../app/util/config', {nconf}).default

  t.case('save', t => {
    t.mock(nconf).expects('save').once()
    config.save()
  })

  t.case('save err', t => {
    t.mock(nconf).expects('save').once().callsArgWith(0, 'uh oh')
    config.save()
  })

  t.case('set', t => {
    const mock = t.mock(nconf)
    mock.expects('set').once()
    mock.expects('save').once()
    config.set('key', 'val')
  })

  t.case('clear', t => {
    const mock = t.mock(nconf)
    mock.expects('clear').once()
    mock.expects('save').once()
    config.clear('key')
  })

  t.case('get', t => {
    const mock = t.mock(nconf)
    mock.expects('get').once()
    config.get('key')
  })
})
