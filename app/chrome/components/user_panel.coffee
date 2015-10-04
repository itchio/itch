
{ div, span, img } = require("react").DOM

classNames = require "classnames"
component = require "./component"

remote = window.require "remote"
api = remote.require "./metal/api"
AppStore = remote.require "./metal/stores/AppStore"

module.exports = component {
  displayName: "UserPanel"

  getInitialState: ->
    { user: null }

  render: ->
    (div { className: classNames("user_panel", loading: !@props.me) },
      if @props.me
        [
          (img { className: "avatar", src: @props.me.cover_url })
          (div { className: "username" }, @props.me.username)
        ]
      else
        "Loading..."
    )
}

