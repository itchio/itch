
{ div } = React.DOM

component = require "./component"
GameList = require "./game_list"

Immutable = require "immutable"

remote = window.require "remote"
AppStore = remote.require "./metal/stores/AppStore"

module.exports = component {
  displayName: "LibraryContent"

  render: ->
    games = @props.data.get "games"
    div className: "main_content",
      (GameList Immutable.fromJS { games })
}
