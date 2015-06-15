
I.api = =>
  @_api ||= new I.ItchioApi
  @_api

I.config = =>
  @_config ||= new I.Config
  @_config

I.current_user = =>
  throw Error "no current user" unless @_current_user
  @_current_user

I.has_current_user = =>
  !!@_current_user

I.set_current_user = (data) =>
  @_current_user = if data instanceof I.ItchioApiUser
    data
  else if data
    new I.ItchioApiUser I.api(), data
  else
    null

class I.Config
  id: 0

  constructor: ->
    @listeners = {}
    @ipc = require "ipc"
    @ipc.on "return_get_config", (id, val) =>
      l = @listeners[id]
      l? val
      delete @listeners[id]


  set: (key, val) =>
    @ipc.send "set_config", key, val

  get: (key, fn) =>
    id = @id++
    @ipc.send "get_config", id, key
    @listeners[id] = fn

class I.ItchioApiUser
  @get_saved_user: =>
    new Promise (resolve, reject) ->
      I.config().get "api_key", (key) =>
        if key
          I.api().login_key(key).then (res) =>
            resolve new I.ItchioApiUser I.api(), { key: key }
        else
          reject []

  constructor: (@api, @key) ->
    throw Error "Missing key for user" unless @key?.key

  request: (method, url, params) ->
    url = "/#{@key.key}#{url}"
    @api.request method, url, params

  save_login: ->
    I.config().set "api_key", @key.key

  my_games: ->
    @request "get", "/my-games"

  my_owned_keys: ->
    @request "get", "/my-owned-keys"

  my_claimed_keys: ->
    @request "get", "/my-claimed-keys"

  me: ->
    @request "get", "/me"

  download_key_uploads: (download_key_id) ->
    @request "get", "/download-key/#{download_key_id}/uploads"

  download_upload: (download_key_id, upload_id)->
    @request "get", "/download-key/#{download_key_id}/download/#{upload_id}"

class I.ItchioApi
  root_url: "https://itch.io/api/1"

  request: (method, url, params) ->
    querystring = require("querystring")
    method = method.toLowerCase()

    data = null
    url = "#{@root_url}#{url}"

    switch method
      when "get"
        url += "?#{querystring.stringify params}"
      when "post"
        data = new FormData
        for own k,v of params
          data.append k, v

    new Promise (resolve, reject) ->
      req = new XMLHttpRequest

      req.onreadystatechange = ->
        if req.readyState == 4
          if req.status != 200
            reject ["Server failed"]
            return

          res = req.responseText
          res = JSON.parse res

          if res.errors
            reject res.errors
            return

          resolve res

      req.open method, url

      if data
        req.send data
      else
        req.send()

  login_key: (key) =>
    @request "post", "/#{key}/me", {
      source: "desktop"
    }

  login_with_password: (username, password) ->
    @request "post", "/login", {
      username: username
      password: password
      source: "desktop"
    }

