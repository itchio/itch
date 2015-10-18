import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

let setup = (t, returns) => {
  let request = t.stub().resolves({id: 12})

  let stubs = {
    'request-promise': request
  }

  let api = proxyquire('../../app/util/api', stubs)
  api.client.root_url = 'http://example.org/'

  let user = new api.User(api.client, 'key')
  return {api, request, user}
}

test('api', t => {
  let {api, request, user} = setup(t)
  let {client} = api

  let common = { uri: 'http://example.org/yo', json: true }

  t.case('can GET', t => {
    return client.request('GET', 'yo', {b: 11}).then(res => {
      sinon.assert.calledWith(request, Object.assign({
        method: 'GET', qs: {b: 11}
      }, common))
    })
  })

  t.case('can POST', t => {
    return client.request('POST', 'yo', {b: 22}).then(res => {
      sinon.assert.calledWith(request, Object.assign({
        method: 'POST', form: {b: 22}
      }, common))
    })
  })

  t.case('can make authenticated request', t => {
    let mock = t.mock(client)
    mock.expects('request').withArgs('get', '/key/my-games')
    user.my_games()
  })

  t.case('rejects API errors', t => {
    let errors = ['foo', 'bar', 'baz']
    let spy = t.spy()
    request.resolves({errors})
    return client.request('GET', '', {}).catch(spy).then(res => {
      sinon.assert.calledWith(spy, errors)
    }).then(res => {
      request.resolves({id: 42})
    })
  })

  {
    let test_api = function (endpoint, args, expected) {
      t.case(`${expected[0].toUpperCase()} ${endpoint}`, t => {
        let spy = t.spy(client, 'request')
        client[endpoint].apply(client, args)
        sinon.assert.calledWith.apply(sinon.assert, [spy].concat(expected))
      })
    }

    test_api(
      'login_key', ['foobar'],
      ['post', '/foobar/me', {source: 'desktop'}]
    )

    test_api(
      'login_with_password', ['foo', 'bar'],
      ['post', '/login', {username: 'foo', password: 'bar', source: 'desktop'}]
    )
  }

  {
    let test_api = function (endpoint, args, expected) {
      t.case(`${expected[0].toUpperCase()} ${endpoint}`, t => {
        let spy = t.spy(user, 'request')
        user[endpoint].apply(user, args)
        sinon.assert.calledWith.apply(sinon.assert, [spy].concat(expected))
      })
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
  }
})
