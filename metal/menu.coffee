
Menu = require "menu"

AppStore = require "./stores/AppStore"
AppActions = require "./actions/AppActions"

refresh_menu = ->
  menus = {
    file: {
      label: "File"
      submenu: [
        {
          label: "Quit"
          accelerator: "Command+Q"
          click: ->
            AppActions.quit()
        }
      ]
    }

    account: {
      label: "Account"
      submenu: [
        {
          label: "Log out"
          click: ->
            AppActions.logout()
        }
      ]
    }
  }

  template = [menus.file]

  if AppStore.get_current_user()
    template.push menus.account

  # gotcha: buildFromTemplate mutates its argument - calling it
  # twice with the same argument throws 'Invalid menu template'
  Menu.setApplicationMenu Menu.buildFromTemplate template

module.exports = { refresh_menu }

