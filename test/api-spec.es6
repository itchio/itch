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

test('api Client.request', t => {
  let {api, request} = setup(t)
  let {client} = api

  return Promise.all([
    client.request('GET', 'yo', {b: 22}),
    client.request('POST', 'yo', {b: 22})
  ]).then(() => {
    let common = { uri: 'http://example.org/yo', json: true }

    sinon.assert.calledWith(request, assign({
      method: 'GET', qs: {b: 22}
    }, common))

    sinon.assert.calledWith(request, assign({
      method: 'POST', form: {b: 22}
    }, common))
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

test('api Client', t => {
  let {client} = setup(t).api
  let mock = t.mock(client)

  mock.expects('request').withArgs(
    'post', '/foobar/me', {source: 'desktop'})
  client.login_key('foobar')

  mock.expects('request').withArgs(
    'post', '/login', {username: 'foo', password: 'bar', source: 'desktop'})
  client.login_with_password('foo', 'bar')
})

test('api User.request', t => {
  let {user} = setup(t)
  let mock = t.mock(user.client)
  mock.expects('request').withArgs('get', '/key/my-games')
  user.my_games()
})

test('api User', t => {
  let {user} = setup(t)
  let mock = t.mock(user)

  mock.expects('request').withArgs('get', '/my-games')
  user.my_games()

  mock.expects('request').withArgs('get', '/my-owned-keys')
  user.my_owned_keys()

  mock.expects('request').withArgs('get', '/my-claimed-keys')
  user.my_claimed_keys()

  mock.expects('request').withArgs('get', '/me')
  user.me()

  mock.expects('request').withArgs('get', '/my-collections')
  user.my_collections()

  mock.expects('request').withArgs('get', '/download-key/foobar/uploads')
  user.download_key_uploads('foobar')

  mock.expects('request').withArgs('get', '/download-key/foobar/download/99')
  user.download_upload_with_key('foobar', 99)

  mock.expects('request').withArgs('get', '/game/33/uploads')
  user.game_uploads(33)

  mock.expects('request').withArgs('get', '/upload/99/download')
  user.download_upload(99)
})
