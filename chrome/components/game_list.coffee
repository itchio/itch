
{ div, span } = React.DOM
component = require "./component"

GameCell = component {
  displayName: "GameCell"

  render: ->
    game = @props.game

    thumbClasses = "game_thumb"

    if game.cover_url
      thumbClasses += " has_cover"

    div className: "game_cell",
      (div className: "bordered",
        (div {
          className: thumbClasses
          onClick: => @props.setGame game
          style: {
            backgroundImage: if cover = @props.game.cover_url
              "url('#{cover}')"
            }
        }),
        (div className: "game_launch button", onClick: (->
          console.log "Should launch!"
        ), (span className: "icon icon-gamepad"), "Launch")),
      (div className: "game_title", game.title),
      game.user and (div className: "game_author", game.user.display_name),

}

module.exports = component {
  displayName: "GameList"

  render: ->
    div className: "game_list",
      (for game in @props.games
        GameCell game: game, setGame: @props.setGame)...
}

