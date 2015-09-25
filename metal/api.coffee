
request = require "request-promise"

Promise = require "bluebird"
Immutable = require "seamless-immutable"

##
# Wrapper for the itch.io API
##
class Client
  root_url: "https://itch.io/api/1"
  # root_url: "http://localhost.com:8080/api/1"

  request: (method, path, data) ->
    uri = "#{@root_url}#{path}"
    options = { method, uri }

    switch method.toLowerCase()
      when 'get'
        options.qs = data
      when 'post'
        options.form = data

    request(options).then(JSON.parse).then (res) =>
      if res.errors
        Promise.reject Immutable res.errors
      else
        Immutable res

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

##
# A user, according to the itch.io API
##
class User
  constructor: (@client, @key) ->
    throw Error "Missing key for user" unless @key

  request: (method, url, params) ->
    url = "/#{@key}#{url}"
    @client.request method, url, params

  my_games: ->
    @request "get", "/my-games"

  my_owned_keys: ->
    @request "get", "/my-owned-keys"

  my_claimed_keys: ->
    @request "get", "/my-claimed-keys"

  me: ->
    @request "get", "/me"

  my_collections: ->
    @request "get", "/my-collections"

  download_key_uploads: (download_key_id) ->
    @request "get", "/download-key/#{download_key_id}/uploads"

  download_upload_with_key: (download_key_id, upload_id)->
    @request "get", "/download-key/#{download_key_id}/download/#{upload_id}"

  game_uploads: (game_id) ->
    @request "get", "/game/#{game_id}/uploads"

  download_upload: (upload_id) ->
    @request "get", "/upload/#{upload_id}/download"

client = new Client

module.exports = {
  client
  Client
  User
}

