
{ div } = React.DOM
component = require "./component"

LibrarySidebar = require "./library_sidebar"
LibraryContent = require "./library_content"
GameBox = require "./game_box"

module.exports = component {
  displayName: "LibraryPage"

  render: ->
    div className: "library_page",
      (LibrarySidebar @props.data),
      (LibraryContent @props.data),
      if game = @props.data.get('game')
        (GameBox game)
}

