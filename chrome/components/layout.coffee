
component = require "./component"
LoginPage = require "./login_page"
LibraryPage = require "./library_page"

remote = window.require "remote"
AppStore = remote.require "./metal/stores/AppStore"
AppActions = remote.require "./metal/actions/AppActions"

get_state = ->
  AppStore.get_state()

module.exports = component {
  displayName: "Layout"

  getInitialState: ->
    get_state()

  componentDidMount: ->
    AppStore.add_change_listener @_on_change
    AppActions.boot()

  componentWillUnmount: ->
    AppStore.remove_change_listener @_on_change

  render: ->
    switch @state.page
      when 'login'
        (LoginPage @state.login)
      when 'library'
        (LibraryPage @state.library)

  # non-React methods

  _on_change: ->
    @setState get_state()
}

