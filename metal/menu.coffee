
Menu = require "menu"

api = require "./api"
config = require "./config"
AppStore = require "./stores/AppStore"
AppActions = require "./actions/AppActions"

menus = {
  file: {
    label: "File"
    submenu: [
      {
        label: "Quit"
        accelerator: "Command+Q"
        click: =>
          AppActions.quit()
      }
    ]
  }

  account: {
    label: "Account"
    submenu: [
      {
        label: "Log out"
        click: =>
          AppActions.logout()
      }
    ]
  }
}

set_menu = ->
  template = [menus.file]

  state = AppStore.get_state()
  if state.has('current_user')
    template.push menus.account

  Menu.setApplicationMenu Menu.buildFromTemplate template

module.exports = { set_menu }

