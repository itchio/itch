
{ div, hr } = React.DOM

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

        (for id, collection of (@props.collections or {})
          (LibraryPanelLink {
            name: "collections/#{id}"
            label: collection.title
            panel
          })
        )...

        (for id, install of (@props.installs or {})
          percent = install.progress > 0 and " #{(install.progress * 100).toFixed(1)}%" or ""
          state = "#{install.state.toLowerCase()}#{percent}"
          label = "#{install.game.title} (#{state})"

          (LibraryPanelLink {
            name: "installs/#{id}"
            label
            panel
          })
        )...

      )
    )

}

