
import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'
import cooldown from '../stubs/cooldown'

test('api', t => {
  const needle = test.module({
    requestAsync: async () => ({body: {id: 12}, statusCode: 200})
  })

  const stubs = Object.assign({
    '../promised/needle': needle,
    '../util/cooldown': cooldown
  }, electron)

  const api = proxyquire('../../app/util/api', stubs).default
  api.ensure_array = (x) => x
  api.client.root_url = 'http://example.org/'

  const user = new api.User(api.client, 'key')
  const client = api.client

  const uri = 'http://example.org/yo'

  t.case('can GET', async t => {
    const request = t.spy(needle, 'requestAsync')
    await client.request('GET', 'yo', {b: 11})
    sinon.assert.calledWith(request, 'GET', uri, {b: 11})
  })

  t.case('can POST', async t => {
    const request = t.spy(needle, 'requestAsync')
    await client.request('POST', 'yo', {b: 22})
    sinon.assert.calledWith(request, 'POST', uri, {b: 22})
  })

  t.case('can make authenticated request', t => {
    const mock = t.mock(client)
    mock.expects('request').withArgs('get', '/key/my-games').resolves({games: []})
    user.myGames()
  })

  t.case('rejects API errors', async t => {
    const errors = ['foo', 'bar', 'baz']

    t.stub(needle, 'requestAsync').resolves({body: {errors}, statusCode: 200})
    let err
    try {
      await client.request('GET', '', {})
    } catch (e) { err = e }
    t.same(err, {errors})
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
      'loginKey', ['foobar'],
      ['post', '/foobar/me', {source: 'desktop'}]
    )

    test_api(
      'loginWithPassword', ['foo', 'bar'],
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
      'myGames', [],
      ['get', '/my-games']
    )
    test_api(
      'my_ownedKeys', [],
      ['get', '/my-owned-keys']
    )
    test_api(
      'me', [],
      ['get', '/me']
    )
    test_api(
      'myCollections', [],
      ['get', '/my-collections']
    )
    test_api(
      'collectionGames', [1708],
      ['get', '/collection/1708/games', {page: 1}]
    )
    test_api(
      'search', ['baz'],
      ['get', '/search/games', {query: 'baz'}]
    )
    test_api(
      'downloadKeyUploads', ['foobar'],
      ['get', '/download-key/foobar/uploads']
    )
    test_api(
      'downloadUploadWithKey', ['foobar', 99],
      ['get', '/download-key/foobar/download/99']
    )
    test_api(
      'gameUploads', [33],
      ['get', '/game/33/uploads']
    )
    test_api(
      'downloadUpload', [99],
      ['get', '/upload/99/download']
    )
  }
})
