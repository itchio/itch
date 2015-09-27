
{ div, h3 } = React.DOM

component = require "./component"
UserPanel = require "./user_panel"
LibraryPanelLink = require "./library_panel_link"

module.exports = component {
  displayName: "LibrarySidebar"

  render: ->
    panel = @props.panel

    (div className: "sidebar",
      (UserPanel @props),
      (div { className: "panel_links" },
        (h3 {}, "Tabs")

        (LibraryPanelLink {
          name: "owned"
          label: "Owned"
          panel
        })

        (LibraryPanelLink {
          name: "dashboard"
          label: "Dashboard"
          panel
        })

        (h3 {}, "Collections")

        (for id, collection of (@props.collections or {})
          (LibraryPanelLink {
            name: "collections/#{id}"
            label: collection.title
            panel
          })
        )...

        (h3 {}, "Installed")

        (for id, install of (@props.installs or {})
          label = install.game.title
          icon = switch install.state
            when 'ERROR'
              'error'
            when 'PENDING', 'SEARCHING_UPLOAD'
              'stopwatch'
            when 'DOWNLOADING'
              'download'
            when 'EXTRACTING'
              'file-zip'
            when 'CONFIGURING'
              'settings'
            when 'RUNNING'
              'gamepad'
            else
              'checkmark'

          (LibraryPanelLink {
            name: "installs/#{id}"
            label
            panel
            icon
            progress: install.progress
          })
        )...

      )
    )

}

