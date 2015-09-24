
Immutable = require "immutable"

component = require "./component"
LoginPage = require "./login_page"
LibraryPage = require "./library_page"

remote = window.require "remote"
menu = remote.require "./metal/menu"
AppStore = remote.require "./metal/stores/AppStore"
AppActions = remote.require "./metal/actions/AppActions"

get_state = ->
  { state: Immutable.fromJS(AppStore.get_state().toJS()) }

module.exports = component {
  displayName: "Layout"

  getInitialState: ->
    get_state()

  componentDidMount: ->
    AppStore.add_change_listener @_on_change
    AppActions.boot()
    # TODO don't call set_menu explicitly
    menu.set_menu()

  componentWillUnmount: ->
    AppStore.remove_change_listener @_on_change

  shouldComponentUpdate: (newProps, newState) ->
    @state.state != newState.state

  render: ->
    state = @state.state
    console.log "state = ", state

    switch state.get "page"
      when 'login'
        (LoginPage state.get "login")
      when 'library'
        (LibraryPage state.get "library")

  # non-React methods

  _on_change: ->
    @setState get_state()
}

