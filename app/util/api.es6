
import request from 'request-promise'
import Immutable from 'seamless-immutable'

/**
 * Wrapper for the itch.io API
 */
class Client {
  constructor () {
    this.root_url = 'https://itch.io/api/1'
    // this.root_url = 'http://localhost.com:8080/api/1'
  }

  request (method, path, data) {
    let uri = `${this.root_url}${path}`
    let options = { json: true, method, uri }

    switch (method.toLowerCase()) {
      case 'get':
        options.qs = data
        break
      case 'post':
        options.form = data
        break
    }

    return request(options).then(res => {
      if (res.errors) {
        throw Immutable(res.errors)
      }
      return Immutable(res)
    })
  }

  login_key (key) {
    return this.request('post', `/${key}/me`, {
      source: 'desktop'
    })
  }

  login_with_password (username, password) {
    return this.request('post', '/login', {
      username: username,
      password: password,
      source: 'desktop'
    })
  }
}

/**
 * A user, according to the itch.io API
 */
class User {
  constructor (client, key) {
    this.client = client
    this.key = key
  }

  request (method, path, params) {
    let url = `/${this.key}${path}`
    return this.client.request(method, url, params)
  }

  my_games () {
    return this.request('get', `/my-games`)
  }

  my_owned_keys () {
    return this.request('get', `/my-owned-keys`)
  }

  my_claimed_keys () {
    return this.request('get', `/my-claimed-keys`)
  }

  me () {
    return this.request('get', `/me`)
  }

  my_collections () {
    return this.request('get', `/my-collections`)
  }

  download_key_uploads (download_key_id) {
    return this.request('get', `/download-key/${download_key_id}/uploads`)
  }

  download_upload_with_key (download_key_id, upload_id) {
    return this.request('get', `/download-key/${download_key_id}/download/${upload_id}`)
  }

  game_uploads (game_id) {
    return this.request('get', `/game/${game_id}/uploads`)
  }

  download_upload (upload_id) {
    return this.request('get', `/upload/${upload_id}/download`)
  }
}

let self = {
  Client,
  User,
  client: new Client()
}

export default self
