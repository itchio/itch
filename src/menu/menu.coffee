

I.menus = {
  file: {
    label: "File"
    submenu: [
      {
        label: "Quit"
        accelerator: "Command+Q"
        click: =>
          app = require("remote").require("app")
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
          I.config().set "api_key", null
          I.set_current_user null
          React.render (R.LoginPage {}), document.body
      }
    ]
  }
}

I.set_menu = ->
  Menu = require("remote").require "menu"
  menus = [I.menus.file]

  if I.has_current_user()
    menus.push I.menus.account

  Menu.setApplicationMenu Menu.buildFromTemplate menus


