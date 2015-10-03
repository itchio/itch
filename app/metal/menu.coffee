
Menu = require "menu"

AppStore = require "./stores/AppStore"
AppActions = require "./actions/AppActions"
AppDispatcher = require "./dispatcher/AppDispatcher"

refresh_menu = ->
  mac = (process.platform == "darwin")
  repo_url = "https://github.com/itchio/itchio-app"
  open_url = (url) ->
    require("shell").openExternal url

  menus = {
    file: {
      label: "File"
      submenu: [
        {
          label: "Close Window"
          accelerator: "CmdOrCtrl+W"
          click: -> AppActions.hide_window()
        }
        {
          label: "Quit"
          accelerator: "CmdOrCtrl+Q"
          click: -> AppActions.quit()
        }
      ]
    }

    account: {
      label: "Account"
      submenu: [
        {
          label: "Log out"
          click: -> AppActions.logout()
        }
      ]
    }

    help: {
      label: "Help"
      submenu: [
        {
          label: "View itch.io Terms"
          click: -> open_url "https://itch.io/docs/legal/terms"
        }
        {
          label: "View License"
          click: -> open_url "#{repo_url}/blob/master/LICENSE"
        }
        {
          label: "Version #{require("app").getVersion()}"
          enabled: false
        }
        {
          label: "Check for Update"
          click: -> console.log "check for update: stub"
        }
        {
          type: "separator"
        }
        {
          label: "Report Issue"
          click: -> open_url "#{repo_url}/issues/new"
        }
        {
          label: "Search Issue"
          click: -> open_url "#{repo_url}/search?type=Issues"
        }
        {
          type: "separator"
        }
        {
          label: "Release Notes"
          click: -> open_url "#{repo_url}/releases"
        }
      ]
    }
  }

  template = [menus.file]

  if AppStore.get_current_user()
    template.push menus.account

  template.push menus.help

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

