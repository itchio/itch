
I.menus = {
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
          I.config().set "api_key", null
          I.setCurrentUser null
          React.render (R.LoginPage {}), document.body
      }
    ]
  }
}

I.setMenu = ->
  Menu = window.require("remote").require "menu"
  menus = [I.menus.file]

  if I.hasCurrentUser()
    menus.push I.menus.account

  Menu.setApplicationMenu Menu.buildFromTemplate menus


