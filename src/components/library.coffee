
R.component "LibraryPage", {
  render: ->
    div className: "library_page",
      (R.LibrarySidebar {}),
      (R.LibraryContent {})
}

R.component "LibrarySidebar", {
  render: ->
    (div className: "sidebar", "Hello world")
}

R.component "LibraryContent", {
  getInitialState: ->
    { games: null }

  componentDidMount: ->
    console.log "mounted library content"
    I.current_user().my_games().then (res) =>
      console.log res.games
      @setState games: res.games

  render: ->
    console.log "games: ", @state.games
    div className: "main_content",
      if @state.games
        (R.GameList games: @state.games)
}

R.component "GameList", {
  render: ->
    div className: "game_list",
      (for game in @props.games
        R.GameCell game: game)...
}

R.component "GameCell", {
  render: ->
    game = @props.game

    thumb_classes = "game_thumb"

    if game.cover_url
      thumb_classes += " has_cover"

    div className: "game_cell",
      (div className: "bordered",
        (div {
          className: thumb_classes
          style: {
            backgroundImage: if cover = @props.game.cover_url
              "url('#{cover}')"
            }
        })),
      (div className: "game_title", game.title),
      (div className: "game_author", "Api missing author"),

}
