
import ExtendableError from 'es6-error'
import invariant from 'invariant'

import needle from '../promised/needle'
import urls from '../constants/urls'

import mkcooldown from './cooldown'
import mklog from './log'
import {camelifyObject} from './format'

import {call} from 'redux-saga/effects'

const cooldown = mkcooldown(130)
const log = mklog('api')
const logger = new mklog.Logger({sinks: {console: !!process.env.LET_ME_IN}})
const opts = {logger}

// cf. https://github.com/itchio/itchio-app/issues/48
// basically, lua returns empty-object instead of empty-array
// because they're the same in lua (empty table). not in JSON though.
export function ensureArray (v) {
  if (~~v.length === 0) {
    return []
  }
  return v
}

export class ApiError extends ExtendableError {
  constructor (errors) {
    super(errors.join(', '))
    this.errors = errors
  }

  toString () {
    return `API Error: ${this.errors.join(', ')}`
  }
}

/**
 * Wrapper for the itch.io API
 */
export class Client {
  constructor () {
    this.rootUrl = `${urls.itchioApi}/api/1`
    this.lastRequest = 0
  }

  * request (method, path, data = {}, transformers = {}) {
    const t1 = Date.now()

    const uri = `${this.rootUrl}${path}`

    yield call(cooldown)
    const t2 = Date.now()

    const resp = yield call(needle.requestAsync, method, uri, data)
    const body = resp.body
    const t3 = Date.now()

    const shortPath = path.replace(/^\/[^\/]*\//, '')
    log(opts, `${t2 - t1}ms wait, ${t3 - t2}ms http, ${method} ${shortPath} with ${JSON.stringify(data)}`)

    if (resp.statusCode !== 200) {
      throw new Error(`HTTP ${resp.statusCode}`)
    }

    if (body.errors) {
      throw new ApiError(body.errors)
    }
    const camelBody = camelifyObject(body)
    for (const key in transformers) {
      if (!transformers.hasOwnProperty(key)) continue
      camelBody[key] = transformers[key](camelBody[key])
    }

    return camelBody
  }

  * loginKey (key) {
    return yield* this.request('post', `/${key}/me`, {
      source: 'desktop'
    })
  }

  * loginWithPassword (username, password) {
    return yield* this.request('post', '/login', {
      username: username,
      password: password,
      source: 'desktop'
    })
  }

  withKey (key) {
    invariant(typeof key === 'string', 'API key is a string')
    return new AuthenticatedClient(this, key)
  }
}

export const client = new Client()
export default client

/**
 * A user, according to the itch.io API
 */
export class AuthenticatedClient {
  constructor (client, key) {
    this.client = client
    this.key = key
  }

  * request (method, path, data = {}, transformers = {}) {
    const url = `/${this.key}${path}`
    return yield* this.client.request(method, url, data, transformers)
  }

  // TODO: paging, for the prolific game dev.
  * myGames (data = {}) {
    return yield* this.request('get', `/my-games`, data, {games: ensureArray})
  }

  * myOwnedKeys (data = {}) {
    return yield* this.request('get', `/my-owned-keys`, data, {ownedKeys: ensureArray})
  }

  * me () {
    return yield* this.request('get', `/me`)
  }

  * myCollections () {
    return yield* this.request('get', `/my-collections`, {}, {collections: ensureArray})
  }

  * game (game) {
    return yield* this.request('get', `/game/${game}`)
  }

  * collection (collectionId) {
    return yield* this.request('get', `/collection/${collectionId}`)
  }

  * collectionGames (collectionId, page = 1) {
    return yield* this.request('get', `/collection/${collectionId}/games`, {page})
  }

  * search (query) {
    return yield* this.request('get', '/search/games', {query}, {games: ensureArray})
  }

  * downloadKeyUploads (downloadKeyId) {
    return yield* this.request('get', `/download-key/${downloadKeyId}/uploads`)
  }

  * downloadUploadWithKey (downloadKeyId, uploadId) {
    return yield* this.request('get', `/download-key/${downloadKeyId}/download/${uploadId}`)
  }

  * gameUploads (game) {
    return yield* this.request('get', `/game/${game}/uploads`, {}, {uploads: ensureArray})
  }

  * downloadUpload (uploadId) {
    return yield* this.request('get', `/upload/${uploadId}/download`)
  }
}
