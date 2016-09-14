
import ExtendableError from 'es6-error'
import invariant from 'invariant'

import needle from '../promised/needle'
import urls from '../constants/urls'

import mkcooldown from './cooldown'
import mklog from './log'
import {camelifyObject} from './format'

import {contains} from 'underline'

const cooldown = mkcooldown(130)
const log = mklog('api')
const logger = new mklog.Logger({sinks: {console: !!process.env.LET_ME_IN}})
const opts = {logger}

// cf. https://github.com/itchio/itchio-app/issues/48
// basically, lua returns empty-object instead of empty-array
// because they're the same in lua (empty table). not in JSON though.
export function ensureArray (v) {
  if (!v || ~~v.length === 0) {
    return []
  }
  return v
}

export class ApiError extends ExtendableError {
  constructor (errors) {
    super(errors.join(', '))
    this.errors = errors
    this.stack = new Error().stack
    this.message = errors.join(', ')
  }

  toString () {
    return `API Error: ${this.errors.join(', ')}`
  }
}

let agent
import http from 'http'
import https from 'https'

/**
 async Wrapper for the itch.io API
 */
export class Client {
  constructor () {
    this.rootUrl = `${urls.itchioApi}/api/1`
    this.lastRequest = 0
  }

  async request (method, path, data = {}, transformers = {}) {
    if (!agent) {
      const hasHttpProxy = needle.proxy && !/https:/i.test(needle.proxy)
      const hasHttpApi = !/https:/i.test(urls.itchioApi)
      if (hasHttpProxy || hasHttpApi) {
        agent = new http.Agent({
          keepAlive: true,
          maxSockets: 1
        })
      } else {
        agent = new https.Agent({
          keepAlive: true,
          maxSockets: 1
        })
      }
    }

    const t1 = Date.now()

    const uri = `${this.rootUrl}${path}`

    await cooldown()
    const t2 = Date.now()

    const resp = await needle.requestAsync(method, uri, data, {
      agent
    })
    const body = resp.body
    const t3 = Date.now()

    const shortPath = path.replace(/^\/[^\/]*\//, '')
    log(opts, `${t2 - t1}ms wait, ${t3 - t2}ms http, ${method} ${shortPath} with ${JSON.stringify(data)}`)

    if (resp.statusCode !== 200) {
      throw new Error(`HTTP ${resp.statusCode} ${path}`)
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

  async loginKey (key) {
    return await this.request('post', `/${key}/me`, {
      source: 'desktop'
    })
  }

  async loginWithPassword (username, password) {
    return await this.request('post', '/login', {
      username: username,
      password: password,
      source: 'desktop'
    })
  }

  withKey (key) {
    invariant(typeof key === 'string', 'API key is a string')
    return new AuthenticatedClient(this, key)
  }

  hasAPIError (errorObject, apiError) {
    return (errorObject.errors || [])::contains(apiError)
  }

  isNetworkError (errorObject) {
    return (typeof errorObject === 'object' && errorObject.code) && (
      // DNS lookup failed
      errorObject.code === 'ENOTFOUND' ||
      // lost connectivity in the middle of request
      errorObject.code === 'ECONNRESET'
    )
  }
}

export const client = new Client()
export default client

/**
 async A user, according to the itch.io API
 */
export class AuthenticatedClient {
  constructor (client, key) {
    this.client = client
    this.key = key
  }

  async request (method, path, data = {}, transformers = {}) {
    const url = `/${this.key}${path}`
    return await this.client.request(method, url, data, transformers)
  }

  // TODO: paging, for the prolific game dev.
  async myGames (data = {}) {
    return await this.request('get', '/my-games', data, {games: ensureArray})
  }

  async myOwnedKeys (data = {}) {
    return await this.request('get', '/my-owned-keys', data, {ownedKeys: ensureArray})
  }

  async me () {
    return await this.request('get', '/me')
  }

  async myCollections () {
    return await this.request('get', '/my-collections', {}, {collections: ensureArray})
  }

  async game (game) {
    return await this.request('get', `/game/${game}`)
  }

  async user (user) {
    return await this.request('get', `/users/${user}`)
  }

  async collection (collectionId) {
    return await this.request('get', `/collection/${collectionId}`)
  }

  async collectionGames (collectionId, page = 1) {
    return await this.request('get', `/collection/${collectionId}/games`, {page})
  }

  async searchGames (query) {
    return await this.request('get', '/search/games', {query}, {games: ensureArray})
  }

  async searchUsers (query) {
    return await this.request('get', '/search/users', {query}, {users: ensureArray})
  }

  // list uploads

  async listUploads (downloadKey, gameId) {
    if (downloadKey) {
      return await this.request('get', `/download-key/${downloadKey.id}/uploads`, {}, {uploads: ensureArray})
    } else {
      return await this.request('get', `/game/${gameId}/uploads`, {}, {uploads: ensureArray})
    }
  }

  // download uploads

  async downloadUpload (downloadKey, uploadId) {
    if (downloadKey) {
      return await this.request('get', `/download-key/${downloadKey.id}/download/${uploadId}`)
    } else {
      return await this.request('get', `/upload/${uploadId}/download`)
    }
  }

  // wharf-related endpoints (bit of a mess tbh)

  async findUpgrade (downloadKey, uploadId, currentBuildId) {
    if (downloadKey) {
      return await this.request('get', `/download-key/${downloadKey.id}/upgrade/${uploadId}/${currentBuildId}?v=2`)
    } else {
      return await this.request('get', `/upload/${uploadId}/upgrade/${currentBuildId}?v=2`)
    }
  }

  async downloadBuild (downloadKey, uploadId, buildId) {
    if (downloadKey) {
      return await this.request('get', `/download-key/${downloadKey.id}/download/${uploadId}/builds/${buildId}`)
    } else {
      return await this.request('get', `/upload/${uploadId}/download/builds/${buildId}`)
    }
  }

  async subkey (gameId, scope) {
    return await this.request('post', '/credentials/subkey', {game_id: gameId, scope})
  }
}
