
{ div, span } = React.DOM
component = require "./component"

classNames = require "classnames"

remote = window.require "remote"
AppActions = remote.require "./metal/actions/AppActions"

GameCell = component {
  displayName: "GameCell"

  render: ->
    game = @props.game

    (div { className: "game_cell" },
      (div { className: "bordered" },
        (div {
          className: classNames("game_thumb", has_cover: game.cover_url)
          onClick: =>
            AppActions.view_game game
          style: {
            backgroundImage: if cover = @props.game.cover_url
              "url('#{cover}')"
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
    (div { className: "game_list" },
      for game in @props.games
        GameCell {
          game: game
          key: game.id
        }
    )
}

