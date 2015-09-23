
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
          api.setCurrentUser null
          LoginPage = require "../components/login_page"
          React.render (LoginPage {}), document.body
      }
    ]
  }
}

setMenu = ->
  Menu = window.require("remote").require("menu")
  template = [menus.file]

  if api.hasCurrentUser()
    template.push menus.account

  Menu.setApplicationMenu Menu.buildFromTemplate template

module.exports = { setMenu }

