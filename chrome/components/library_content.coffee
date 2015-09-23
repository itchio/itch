
{ div } = React.DOM

component = require "./component"
GameList = require "./game_list"
api = require "../itchio/api"

module.exports = component {
  displayName: "LibraryContent"

  getInitialState: ->
    { games: null, loading: false }

  refreshGames: (props) ->
    user = api.currentUser()

    @setState loading: true
    switch props.currentPanel
      when "dashboard"
        user.myGames().then (res) =>
          @setState games: res.games
      when "owned"
        user.myOwnedKeys().then (res) =>
          games = for key in res.owned_keys
            game = key.game
            game.key = key
            game

          @setState games: games

  componentDidMount: ->
    @refreshGames(@props)

  componentWillReceiveProps: (nextProps) ->
    if @props.currentPanel != nextProps.currentPanel
      @refreshGames(nextProps)

  render: ->
    div className: "main_content",
      if @state.games
        (GameList games: @state.games, setGame: @props.setGame)
}
