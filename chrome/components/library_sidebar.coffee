
{ div } = React.DOM

Immutable = require "immutable"

component = require "./component"
UserPanel = require "./user_panel"
LibraryPanelLink = require "./library_panel_link"

module.exports = component {
  displayName: "LibrarySidebar"

  render: ->
    panel = @props.data.get "panel"

    (div className: "sidebar",
      (UserPanel {}),
      (div { className: "panel_links" },
        (LibraryPanelLink Immutable.fromJS {
          name: "owned"
          label: "Owned"
          panel
        })

        (LibraryPanelLink Immutable.fromJS {
          name: "dashboard"
          label: "Dashboard"
          panel
        })
      )
    )

}

