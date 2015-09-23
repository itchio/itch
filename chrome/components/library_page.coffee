
{ div } = React.DOM
component = require "./component"

LibrarySidebar = require "./library_sidebar"
LibraryContent = require "./library_content"
GameBox = require "./game_box"

module.exports = component {
  displayName: "LibraryPage"

  getInitialState: ->
    { current_panel: "owned", current_game: null }

  render: ->
    div className: "library_page",
      (LibrarySidebar {
        current_panel: @state.current_panel
        set_panel: @set_panel
      }),
      (LibraryContent {
        current_panel: @state.current_panel
        set_game: @set_game
      }),
      @state.current_game and
        (GameBox {
          game: @state.current_game
          set_game: @set_game
        })

  # non-React methods

  set_panel: (name) ->
    @setState current_panel: name

  set_game: (game) ->
    @setState current_game: game
}

