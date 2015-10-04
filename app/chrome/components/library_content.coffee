
{ div } = require("react").DOM

component = require "./component"
GameList = require "./game_list"

remote = window.require "remote"
AppStore = remote.require "./metal/stores/AppStore"

module.exports = component {
  displayName: "LibraryContent"

  render: ->
    games = @props.games
    div className: "main_content",
      (GameList { games })
}
