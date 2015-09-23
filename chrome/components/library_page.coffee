
{ div } = React.DOM
component = require "./component"

LibrarySidebar = require "./library_sidebar"
LibraryContent = require "./library_content"
GameBox = require "./game_box"

module.exports = component {
  displayName: "LibraryPage"

  getInitialState: ->
    { currentPanel: "owned", currentGame: null }

  setPanel: (name) ->
    @setState currentPanel: name

  setGame: (game) ->
    @setState currentGame: game

  render: ->
    div className: "library_page",
      (LibrarySidebar {
        currentPanel: @state.currentPanel
        setPanel: @setPanel
      }),
      (LibraryContent {
        currentPanel: @state.currentPanel
        setGame: @setGame
      }),
      @state.currentGame and
        (GameBox {
          game: @state.currentGame
          setGame: @setGame
        })
}

