
{ div } = React.DOM

component = require "./component"
GameList = require "./game_list"
api = require "../itchio/api"

module.exports = component {
  displayName: "LibraryContent"

  getInitialState: ->
    { games: null, loading: false }

  componentDidMount: ->
    @refresh_games(@props)

  componentWillReceiveProps: (nextProps) ->
    if @props.current_panel != nextProps.current_panel
      @refresh_games(nextProps)

  render: ->
    div className: "main_content",
      if @state.games
        (GameList games: @state.games, set_game: @props.set_game)


  # non-React methods

  refresh_games: (props) ->
    user = api.current_user()

    @setState loading: true
    switch props.current_panel
      when "dashboard"
        user.my_games().then (res) =>
          @setState games: res.games
      when "owned"
        user.my_owned_keys().then (res) =>
          games = for key in res.owned_keys
            game = key.game
            game.key = key
            game

          @setState games: games
}
