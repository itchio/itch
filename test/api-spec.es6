import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

let setup = (t, returns) => {
  if (!returns) returns = JSON.stringify({a: 11})
  let request = t.stub().returns(Promise.resolve(returns))

  let stubs = {
    'request-promise': request
  }

  let api = proxyquire('../app/util/api', stubs)
  api.client.root_url = 'http://example.org/'

  let user = new api.User(api.client, 'key')
  return {api, request, user}
}

test('api plumbing', t => {
  let {api, request} = setup(t)
  let {client} = api

  let post_get = Promise.all([
    client.request('GET', 'yo', {b: 11}),
    client.request('POST', 'yo', {b: 22})
  ]).then(() => {
    let common = { uri: 'http://example.org/yo', json: true }

    sinon.assert.calledWith(request, assign({
      method: 'GET', qs: {b: 11}
    }, common))

    sinon.assert.calledWith(request, assign({
      method: 'POST', form: {b: 22}
    }, common))
  })

  return t.all([
    [post_get, 'client can POST and GET']
  ])
})

test('api error parsing', t => {
  let spy = t.spy()
  let errors = ['foo', 'bar', 'baz']
  let {client} = setup(t, {errors}).api

  return client.request('GET', '', {}).catch(spy).then(res => {
    sinon.assert.calledWith(spy, errors)
  })
})

test('api endpoints', t => {
  let {client} = setup(t).api

  let test_api = function (method, args, expected) {
    let spy = t.spy(client, 'request')
    client[method].apply(client, args)
    t.same(expected, spy.getCall(0).args, method)
    spy.restore()
  }

  test_api(
    'login_key', ['foobar'],
    ['post', '/foobar/me', {source: 'desktop'}]
  )

  test_api(
    'login_with_password', ['foo', 'bar'],
    ['post', '/login', {username: 'foo', password: 'bar', source: 'desktop'}]
  )
})

test('api authenticated plumbing', t => {
  let {user} = setup(t)
  let mock = t.mock(user.client)
  mock.expects('request').withArgs('get', '/key/my-games')
  user.my_games()
})

test('api authenticated endpoints', t => {
  let {user} = setup(t)

  let test_api = function (method, args, expected) {
    let spy = t.spy(user, 'request')
    user[method].apply(user, args)
    t.same(expected, spy.getCall(0).args, method)
    spy.restore()
  }

  test_api(
    'my_games', [],
    ['get', '/my-games']
  )
  test_api(
    'my_owned_keys', [],
    ['get', '/my-owned-keys']
  )
  test_api(
    'my_claimed_keys', [],
    ['get', '/my-claimed-keys']
  )
  test_api(
    'me', [],
    ['get', '/me']
  )
  test_api(
    'my_collections', [],
    ['get', '/my-collections']
  )
  test_api(
    'download_key_uploads', ['foobar'],
    ['get', '/download-key/foobar/uploads']
  )
  test_api(
    'download_upload_with_key', ['foobar', 99],
    ['get', '/download-key/foobar/download/99']
  )
  test_api(
    'game_uploads', [33],
    ['get', '/game/33/uploads']
  )
  test_api(
    'download_upload', [99],
    ['get', '/upload/99/download']
  )
})
