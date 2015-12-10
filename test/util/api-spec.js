let test = require('zopf')
let sinon = require('sinon')
let proxyquire = require('proxyquire')

let electron = require('../stubs/electron')

test('api', t => {
  let request = t.stub().resolves({body: {id: 12}, statusCode: 200})
  let needle = {
    requestAsync: request
  }

  let stubs = Object.assign({
    '../promised/needle': needle
  }, electron)

  let api = proxyquire('../../app/util/api', stubs)
  api.client.root_url = 'http://example.org/'

  let user = new api.User(api.client, 'key')
  let client = api.client

  let uri = 'http://example.org/yo'

  t.case('can GET', t => {
    return client.request('GET', 'yo', {b: 11}).then(res => {
      sinon.assert.calledWith(request, 'GET', uri, {b: 11})
    })
  })

  t.case('can POST', t => {
    return client.request('POST', 'yo', {b: 22}).then(res => {
      sinon.assert.calledWith(request, 'POST', uri, {b: 22})
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
    request.resolves({body: {errors}, statusCode: 200})
    return client.request('GET', '', {}).catch(spy).then(res => {
      sinon.assert.calledWith(spy, sinon.match({errors}))
    }).then(res => {
      request.resolves({body: {id: 42}, statusCode: 200})
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
      'collection_games', [1708],
      ['get', '/collection/1708/games', {page: 1}]
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
