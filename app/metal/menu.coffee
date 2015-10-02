
Menu = require "menu"

AppStore = require "./stores/AppStore"
AppActions = require "./actions/AppActions"
AppDispatcher = require "./dispatcher/AppDispatcher"

refresh_menu = ->
  mac = (process.platform == "darwin")

  menus = {
    file: {
      label: "File"
      submenu: [
        {
          label: "Close Window"
          accelerator: if mac then "Command+W" else "Alt+F4"
          click: ->
            require("app").main_window?.hide()
        }
        {
          label: "Quit"
          accelerator: if mac then "Command+Q" else "Ctrl+Q"
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

install = ->
  AppDispatcher.register (action) ->
    switch action.action_type
      # TODO: keep an eye on that, might need to rebuild in
      # other circumstances.
      when 'BOOT', 'LOGIN_DONE', 'LOGOUT'
        setTimeout (-> refresh_menu()), 0

module.exports = { install }

