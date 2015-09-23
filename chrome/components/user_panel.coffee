
{ div } = React.DOM

component = require "./component"
api = require "../itchio/api"

module.exports = component {
  displayName: "UserPanel"

  getInitialState: ->
    { user: null }

  componentDidMount: ->
    api.currentUser().me().then (res) =>
      @setState user: res.user

  render: ->
    unless @state.user
      return div className: "user_panel loading", "Loading"

    div className: "user_panel",
      "Logged in as #{@state.user.username}",
}

