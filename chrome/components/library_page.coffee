
{ div } = React.DOM
component = require "./component"

LibrarySidebar = require "./library_sidebar"
LibraryContent = require "./library_content"
GameBox = require "./game_box"

remote = window.require "remote"
AppStore = remote.require "./metal/stores/AppStore"

get_library_state = ->
  {
    game: AppStore.get_game()
    panel: AppStore.get_panel()
  }

module.exports = component {
  displayName: "LibraryPage"

  getInitialState: ->
    get_library_state()

  componentDidMount: ->
    AppStore.add_change_listener @_on_change

  componentWillUnmount: ->
    AppStore.remove_change_listener @_on_change

  render: ->
    div className: "library_page",
      (LibrarySidebar {
        panel: @state.panel
      }),
      (LibraryContent {
        panel: @state.panel
      }),
      @state.game and
        (GameBox {
          game: @state.game
        })

  # non-React methods

  _on_change: ->
    @setState get_library_state()
}

