
{ div } = React.DOM

classNames = require "classnames"
component = require "./component"
api = require "../itchio/api"

module.exports = component {
  displayName: "UserPanel"

  getInitialState: ->
    { user: null }

  componentDidMount: ->
    api.current_user().me().then (res) =>
      @setState user: res.user

  render: ->
    (div { className: classNames("user_panel", loading: !@state.user) },
      if @state.user
        "Logged in as #{@state.user.username}"
      else
        "Loading"
    )
}

