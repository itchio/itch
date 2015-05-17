
R.component "LibraryPage", {
  getInitialState: ->
    { current_panel: "owned", current_game: null }

  componentDidMount: ->
    @dispatch {
      set_panel: (name) =>
        @setState current_panel: name

      set_game: (game) =>
        @setState current_game: game
    }

  componentDidUnmount: ->
    @detach?()

  render: ->
    div className: "library_page",
      (R.LibrarySidebar @state),
      (R.LibraryContent @state),
      if @state.current_game
        (R.GameBox { game: @state.current_game })

}

R.component "GameBox", {
  getInitialState: =>
    { uploads: null, loading: false }

  close: ->
    @trigger "set_game", null

  download_upload: (upload) ->
    =>
      I.current_user().download_upload(@props.game.key.id, upload.id).then (res) =>
        console.log res
      , (errors) =>
        console.error "failed to download upload"

  componentDidMount: ->
    return unless @props.game.key

    @setState loading: true
    I.current_user().download_key_uploads(@props.game.key.id).then (res) =>
      @setState loading: false, uploads: res.uploads
    , (errors) =>
      console.error "failed to get download key uploads", errors

  render: ->
    content = if @state.uploads
      @render_uploads()
    else
      ["Loading"]

    (div className: "lightbox_container",
      (div className: "lightbox",
        (div className: "lightbox_close", onClick: @close, "×")
        (div className: "lightbox_header", "Game #{@props.game.id}")
        (div className: "lightbox_content", content...)))

  render_uploads: ->
    for upload in @state.uploads
      (div upload: upload, className: "upload_row",
        (span className: "upload_name", upload.filename),
        (span className: "upload_size", upload.size),
        (span className: "download_btn button", onClick: @download_upload(upload), "Download"))
}

R.component "LibrarySidebar", {
  set_panel: (name) ->
    =>
      @trigger "set_panel", name

  render: ->
    (div className: "sidebar",
      (R.UserPanel {}),
      (div className: "panel_links",
        (R.LibraryPanelLink {
          name: "owned"
          label: "Owned"
          current_panel: @props.current_panel
        }),
        (R.LibraryPanelLink {
          name: "dashboard"
          label: "Dashboard"
          current_panel: @props.current_panel
        })))

}

R.component "LibraryPanelLink", {
  set_panel: (name) ->
    =>
      @trigger "set_panel", name

  render: ->
    classes = "panel_link"
    if @props.name == @props.current_panel
      classes += " current"

    div {
      className: classes
      onClick: @set_panel @props.name
    }, @props.label
}


R.component "LibraryContent", {
  getInitialState: ->
    { games: null, loading: false }

  refresh_games: ->
    user = I.current_user()

    @setState loading: true
    switch @props.current_panel
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

  componentDidMount: ->
    @refresh_games()

  componentDidUpdate: (prev_props) ->
    if prev_props.current_panel != @props.current_panel
      @refresh_games()

  render: ->
    div className: "main_content",
      if @state.games
        (R.GameList games: @state.games)
}

R.component "UserPanel", {
  getInitialState: ->
    { user: null }

  componentDidMount: ->
    I.current_user().me().then (res) =>
      @setState user: res.user
  
  render: ->
    unless @state.user
      return div className: "user_panel loading", "Loading"

    div className: "user_panel",
      "Logged in as #{@state.user.username}",
}

R.component "GameList", {
  render: ->
    div className: "game_list",
      (for game in @props.games
        R.GameCell game: game)...
}

R.component "GameCell", {
  select_game: ->
    @trigger "set_game", @props.game

  render: ->
    game = @props.game

    thumb_classes = "game_thumb"

    if game.cover_url
      thumb_classes += " has_cover"

    div className: "game_cell",
      (div className: "bordered",
        (div {
          className: thumb_classes
          onClick: @select_game
          style: {
            backgroundImage: if cover = @props.game.cover_url
              "url('#{cover}')"
            }
        })),
      (div className: "game_title", game.title),
      (div className: "game_author", "Api missing author"),

}
