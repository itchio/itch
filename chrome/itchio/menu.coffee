
api = require "./api"

menus = {
  file: {
    label: "File"
    submenu: [
      {
        label: "Quit"
        accelerator: "Command+Q"
        click: =>
          app = window.require("remote").require("app")
          app.quit()
      }
    ]
  }

  account: {
    label: "Account"
    submenu: [
      {
        label: "Log out"
        click: =>
          api.config().set "api_key", null
          api.set_current_user null
          LoginPage = require "../components/login_page"
          React.render (LoginPage {}), document.body
      }
    ]
  }
}

set_menu = ->
  Menu = window.require("remote").require("menu")
  template = [menus.file]

  if api.has_current_user()
    template.push menus.account

  Menu.setApplicationMenu Menu.buildFromTemplate template

module.exports = { set_menu }

