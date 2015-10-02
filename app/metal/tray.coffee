
path = require "path"
app = require "app"
Menu = require "menu"
AppActions = require "./actions/AppActions"

make_tray = ->
  tray_menu_template = [
    {
      label: "Owned"
      click: -> AppActions.focus_panel "owned"
    }
    {
      label: "Dashboard"
      click: -> AppActions.focus_panel "dashboard"
    }
  ]
  if process.platform != "darwin"
    tray_menu_template = tray_menu_template.concat [
      {
        type: "separator"
      }
      {
        label: "Exit"
        click: -> AppActions.quit()
      }
    ]

  tray_menu = Menu.buildFromTemplate tray_menu_template

  if process.platform == "darwin"
    app.dock.setMenu tray_menu
  else
    Tray = require "tray"
    tray = new Tray(path.resolve("#{__dirname}/../static/images/itchio-tray-small.png"))
    tray.setToolTip "itch.io"
    tray.setContextMenu tray_menu
    tray.on "clicked", -> AppActions.focus_window()
    tray.on "double-clicked", -> AppActions.focus_window()
    app.main_tray = tray

module.exports = { make_tray }

