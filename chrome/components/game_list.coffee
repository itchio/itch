
{ div, span } = React.DOM
component = require "./component"

classNames = require "classnames"
Immutable = require "immutable"

remote = window.require "remote"
AppActions = remote.require "./metal/actions/AppActions"

GameCell = component {
  displayName: "GameCell"

  render: ->
    console.log "in GameCell render..."
    game = @props.data.get "game"
    console.log "in GameCell, game = ", game.toJS()

    cover_url = game.get "cover_url"

    (div { className: "game_cell", key: game.get("id") },
      (div { className: "bordered" },
        (div {
          className: classNames("game_thumb", has_cover: cover_url)
          onClick: =>
            AppActions.view_game game
          style: {
            backgroundImage: cover_url and "url('#{cover_url}')"
          }
        }),
        (div {
          className: "game_launch button"
          onClick: ->
            console.log "Should launch!"
        },
          (span className: "icon icon-gamepad")
          "Launch"
        )),
      (div { className: "game_title" }, game.get "title"),
      game.get("user") and (div { className: "game_author" }, game.get("user").get("display_name")),
    )
}

module.exports = component {
  displayName: "GameList"

  render: ->
    console.log "In game list, games = ", @props.data.get("games").toJS()
    (div { className: "game_list" }, @props.data.get("games").toJS().map((game) ->
      console.log "Creating gameCell from ", game
      (GameCell Immutable.fromJS {
        game: game
      })
    ))
}

