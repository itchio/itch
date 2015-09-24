
{ div, span } = React.DOM
component = require "./component"

classNames = require "classnames"

remote = window.require "remote"
AppActions = remote.require "./metal/actions/AppActions"

GameCell = component {
  displayName: "GameCell"

  render: ->
    game = @props.game
    cover_url = game.cover_url

    (div { className: "game_cell", key: game.id },
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
      (div { className: "game_title" }, game.title),
      game.user and (div { className: "game_author" }, game.user.display_name),
    )
}

module.exports = component {
  displayName: "GameList"

  render: ->
    games = @props.games

    (div { className: "game_list" },
      for i, game of games
        (GameCell { key: game.id, game })
    )
}

