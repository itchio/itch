import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

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

test('api GET request', t => {
  let {api, request} = setup(t)
  let {client} = api

  return client.request('GET', 'yo', {b: 22}).then(res => {
    sinon.assert.calledWith(request, {
      method: 'GET',
      uri: 'http://example.org/yo',
      json: true,
      qs: {b: 22}
    })
  })
})

test('api POST request', t => {
  let {api, request} = setup(t)
  let {client} = api

  return client.request('POST', 'yo', {b: 22}).then(res => {
    sinon.assert.calledWith(request, {
      method: 'POST',
      uri: 'http://example.org/yo',
      json: true,
      form: {b: 22}
    })
  })
})

test('api errors', t => {
  let errors = ['foo', 'bar', 'baz']
  let {client} = setup(t, {errors}).api
  let spy = t.spy()

  return client.request('GET', '', {}).catch(spy).then(res => {
    sinon.assert.calledWith(spy, errors)
  })
})

test('api Client.login_key', t => {
  let {client} = setup(t).api
  t.mock(client).expects('request').withArgs(
    'post', '/foobar/me', {source: 'desktop'})
  client.login_key('foobar')
})

test('api Client.login_with_password', t => {
  let {client} = setup(t).api
  t.mock(client).expects('request').withArgs(
    'post', '/login', {username: 'foo', password: 'bar', source: 'desktop'})
  client.login_with_password('foo', 'bar')
})

test('api User.request', t => {
  let {user} = setup(t)
  t.mock(user.client).expects('request').withArgs('get', '/key/my-games')
  user.my_games()
})

test('api User.my_games', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/my-games')
  user.my_games()
})

test('api User.my_owned_keys', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/my-owned-keys')
  user.my_owned_keys()
})

test('api User.my_claimed_keys', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/my-claimed-keys')
  user.my_claimed_keys()
})

test('api User.me', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/me')
  user.me()
})

test('api User.my_collections', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/my-collections')
  user.my_collections()
})

test('api User.download_key_uploads', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/download-key/foobar/uploads')
  user.download_key_uploads('foobar')
})

test('api User.download_upload_with_key', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/download-key/foobar/download/99')
  user.download_upload_with_key('foobar', 99)
})

test('api User.game_uploads', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/game/33/uploads')
  user.game_uploads(33)
})

test('api User.download_upload', t => {
  let {user} = setup(t)
  t.mock(user).expects('request').withArgs('get', '/upload/99/download')
  user.download_upload(99)
})
