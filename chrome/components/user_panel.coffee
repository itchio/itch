
{ div } = React.DOM

classNames = require "classnames"
component = require "./component"

remote = window.require "remote"
api = remote.require "./metal/api"
AppStore = remote.require "./metal/stores/AppStore"

module.exports = component {
  displayName: "UserPanel"

  getInitialState: ->
    { user: null }

  componentDidMount: ->
    AppStore.get_state().get('current_user').me().then (res) =>
      @setState user: res.user

  render: ->
    (div { className: classNames("user_panel", loading: !@state.user) },
      if @state.user
        "Logged in as #{@state.user.username}"
      else
        "Loading"
    )
}

