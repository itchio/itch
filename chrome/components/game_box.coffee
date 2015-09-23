
{ div, p, span } = React.DOM

component = require "./component"
api = require "../itchio/api"

module.exports = component {
  displayName: "GameBox"

  getInitialState: =>
    { uploads: null, loading: false, error: null }

  close: ->
    @props.setGame null

  downloadUpload: (upload) ->
    =>
      api.currentUser().downloadUpload(@props.game.key.id, upload.id).then (res) =>
        downloader = window.require("remote")
          .require("./metal/downloader")
        downloader.queue {
          game: @props.game
          upload: upload
          url: res.url
        }
      , (errors) =>
        console.error "failed to download upload"

  componentDidMount: ->
    unless @props.game.key
      @setState error: "Can't download this game (missing download key)"
      return

    @setState loading: true
    api.currentUser().downloadKeyUploads(@props.game.key.id).then (res) =>
      @setState loading: false, uploads: res.uploads
    , (errors) =>
      console.error "failed to get download key uploads", errors

  render: ->
    content = if @state.error
      [(div className: "error_message",
        (p {}, @state.error))]
    else if @state.uploads
      @renderUploads()
    else
      ["Loading..."]

    (div className: "lightbox_container",
      (div className: "lightbox",
        (div className: "lightbox_close", onClick: @close, "×")
        (div className: "lightbox_header", @props.game.title)
        (div className: "lightbox_content game_box", content...)))

  renderUploads: ->
    platforms = [
      ["p_osx", "apple"]
      ["p_windows", "windows8"]
      ["p_linux", "tux"]
    ]

    for upload in @state.uploads
      (div key: "upload-#{upload.id}", className: "upload_row",
        (span className: "download_btn button", onClick: @downloadUpload(upload), "Download"),
        (span className: "upload_name", upload.filename),
        (span className: "upload_size", "(#{_.str.formatBytes upload.size})"),
        (span className: "upload_platforms", platforms.map (platform) ->
          if upload[platform[0]]
            (span className: "icon icon-#{platform[1]}")
        ))
}

