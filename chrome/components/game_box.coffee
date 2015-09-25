
{ div, p, span } = React.DOM

component = require "./component"

remote = window.require "remote"
AppStore = remote.require "./metal/stores/AppStore"
AppActions = remote.require "./metal/actions/AppActions"
api = remote.require "./metal/api"

module.exports = component {
  displayName: "GameBox"

  getInitialState: =>
    { uploads: null, loading: false, error: null }

  componentDidMount: ->
    @setState loading: true
    if key = @props.game.key
      AppStore.get_current_user().download_key_uploads(key.id).then (res) =>
        @setState loading: false, uploads: res.uploads
      , (errors) =>
        console.error "failed to get download key uploads", errors
    else
      AppStore.get_current_user().game_uploads(@props.game.id).then (res) =>
        @setState loading: false, uploads: res.uploads
      , (errors) =>
        console.error "failed to get uploads", errors

  render: ->
    content = if @state.error
      (p { className: "error_message" }, @state.error)
    else if @state.uploads
      @render_uploads()
    else
      (p { className: "loading" }, "Loading...")

    (div { className: "lightbox_container", onClick: -> AppActions.close_game() },
      (div { className: "lightbox", onClick: (e) -> e.stopPropagation() },
        (div { className: "lightbox_close", onClick: -> AppActions.close_game() }, "×")
        (div { className: "lightbox_header" }, @props.game.title)
        (div { className: "lightbox_content game_box" }, content)))

  # non-React methods

  render_uploads: ->
    platforms = [
      ["p_osx", "apple"]
      ["p_windows", "windows8"]
      ["p_linux", "tux"]
    ]

    if @state.uploads?.length
      @state.uploads.map (upload) =>
        (div key: "upload-#{upload.id}", className: "upload_row",
          (span className: "upload_name", upload.filename),
          (span className: "upload_size", "(#{_.str.formatBytes upload.size})"),
          (span className: "upload_platforms", platforms.map (platform) ->
            if upload[platform[0]]
              (span key: "platform-#{platform[0]}", className: "icon icon-#{platform[1]}")
          ))
    else
      (p {}, "No uploads.")

}

