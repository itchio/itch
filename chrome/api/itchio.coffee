
I.api = =>
  @_api ||= new I.ItchioApi
  @_api

I.config = =>
  @_config ||= require("remote").require("./node/config")
  @_config

I.currentUser = =>
  throw Error "no current user" unless @_currentUser
  @_currentUser

I.hasCurrentUser = =>
  !!@_currentUser

I.setCurrentUser = (data) =>
  @_currentUser = if data instanceof I.ItchioApiUser
    data
  else if data
    new I.ItchioApiUser I.api(), data
  else
    null

class I.ItchioApiUser
  @getSavedUser: =>
    new Promise (resolve, reject) ->
      if key = I.config().get "api_key"
        I.api().loginKey(key).then (res) =>
          resolve new I.ItchioApiUser I.api(), { key: key }
        , =>
          reject []
      else
        reject []

  constructor: (@api, @key) ->
    throw Error "Missing key for user" unless @key?.key

  request: (method, url, params) ->
    url = "/#{@key.key}#{url}"
    @api.request method, url, params

  saveLogin: ->
    I.config().set "api_key", @key.key

  myGames: ->
    @request "get", "/my-games"

  myOwnedKeys: ->
    @request "get", "/my-owned-keys"

  myClaimedKeys: ->
    @request "get", "/my-claimed-keys"

  me: ->
    @request "get", "/me"

  downloadKeyUploads: (downloadKeyId) ->
    @request "get", "/download-key/#{downloadKeyId}/uploads"

  downloadUpload: (downloadKeyId, uploadId)->
    @request "get", "/download-key/#{downloadKeyId}/download/#{uploadId}"

class I.ItchioApi
  rootUrl: "https://itch.io/api/1"
  # rootUrl: "http://localhost.com:8080/api/1"

  request: (method, url, params) ->
    querystring = require("querystring")
    method = method.toLowerCase()

    data = null
    url = "#{@rootUrl}#{url}"

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

  loginKey: (key) =>
    @request "post", "/#{key}/me", {
      source: "desktop"
    }

  loginWithPassword: (username, password) ->
    @request "post", "/login", {
      username: username
      password: password
      source: "desktop"
    }

