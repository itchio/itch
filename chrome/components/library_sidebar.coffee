
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
      (div { className: "panel_links" }, [
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
      ].concat if @props.collections
        [(div { className: "panel_link" }, (hr {}))].concat(
          @props.collections.map (collection) ->
            (LibraryPanelLink {
              name: "collection.#{collection.id}"
              label: collection.title
              panel
            })
        )
      )
    )

}

