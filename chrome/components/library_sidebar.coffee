
{ div } = React.DOM

component = require "./component"
UserPanel = require "./user_panel"
LibraryPanelLink = require "./library_panel_link"

module.exports = component {
  displayName: "LibrarySidebar"

  render: ->
    (div className: "sidebar",
      (UserPanel {}),
      (div { className: "panel_links" }, [
        (LibraryPanelLink {
          name: "owned"
          label: "Owned"
          current_panel: @props.current_panel
          set_panel: @props.set_panel
        })
        (LibraryPanelLink {
          name: "dashboard"
          label: "Dashboard"
          current_panel: @props.current_panel
          set_panel: @props.set_panel
        })
      ])
    )

}

