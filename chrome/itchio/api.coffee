
get = =>
  @_api ||= new Api
  @_api

config = =>
  @_config ||= window.require("remote").require("./metal/config")
  @_config

currentUser = =>
  throw Error "no current user" unless @_currentUser
  @_currentUser

hasCurrentUser = =>
  !!@_currentUser

setCurrentUser = (data) =>
  @_currentUser = if data instanceof ApiUser
    data
  else if data
    new ApiUser get(), data
  else
    null

##
# A user, according to the itch.io API
##
class ApiUser
  @getSavedUser: =>
    new Promise (resolve, reject) ->
      if key = config().get "api_key"
        get().loginKey(key).then (res) =>
          resolve new ApiUser get(), { key: key }
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
    config().set "api_key", @key.key

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

##
# Wrapper for the itch.io API
##
class Api
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

module.exports = {
  get
  config
  currentUser
  hasCurrentUser
  setCurrentUser
  Api
  ApiUser
}

