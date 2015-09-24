
{ div, p, span } = React.DOM

component = require "./component"
api = require "../itchio/api"

remote = window.require "remote"
AppActions = remote.require "./metal/actions/AppActions"

module.exports = component {
  displayName: "GameBox"

  getInitialState: =>
    { uploads: null, loading: false, error: null }

  componentDidMount: ->
    unless @props.game.key
      @setState error: "Can't download this game (missing download key)"
      return

    @setState loading: true
    api.current_user().download_key_uploads(@props.game.key.id).then (res) =>
      @setState loading: false, uploads: res.uploads
    , (errors) =>
      console.error "failed to get download key uploads", errors

  render: ->
    content = if @state.error
      (p { className: "error_message" }, @state.error)
    else if @state.uploads
      @render_uploads()
    else
      (p { className: "loading" }, "Loading...")

    (div { className: "lightbox_container" },
      (div { className: "lightbox" },
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

    for upload in @state.uploads
      (div key: "upload-#{upload.id}", className: "upload_row",
        (span className: "download_btn button", onClick: @download_upload(upload), "Download"),
        (span className: "upload_name", upload.filename),
        (span className: "upload_size", "(#{_.str.formatBytes upload.size})"),
        (span className: "upload_platforms", platforms.map (platform) ->
          if upload[platform[0]]
            (span key: "platform-#{platform[0]}", className: "icon icon-#{platform[1]}")
        ))

  download_upload: (upload) ->
    =>
      api.current_user().download_upload(@props.game.key.id, upload.id).then (res) =>
        downloader = window.require("remote")
          .require("./metal/downloader")
        downloader.queue {
          game: @props.game
          upload: upload
          url: res.url
        }
      , (errors) =>
        console.error "failed to download upload"
}

