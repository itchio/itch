
I.api = =>
  @_api ||= new I.ItchioApi
  @_api

I.current_user = =>
  throw Error "no current user" unless @_current_user
  @_current_user

I.set_current_user = (data) =>
  @_current_user = new I.ItchioApiUser I.api(), data

class I.ItchioApiUser
  constructor: (@api, @data) ->

class I.ItchioApi
  root_url: "https://itch.io/api/1"

  request: (method, url, params) =>
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

  login_with_password: (username, password) ->
    @request "post", "/login", {
      username: username
      password: password
      source: "desktop"
    }

