
app = require "app"
window = require "./window"
AppConstants = require "./constants/app_constants"
AppDispatcher = require "./dispatcher/app_dispatcher"

install = ->
  AppDispatcher.register (action) ->

    switch action.action_type

      when AppConstants.SET_PROGRESS
        { alpha } = action
        percent = alpha * 100
        window.get()?.setProgressBar(alpha)
        app.dock?.setBadge "#{percent.toFixed()}%"

      when AppConstants.CLEAR_PROGRESS
        window.get()?.setProgressBar(-1)
        app.dock?.setBadge ""

      when AppConstants.BOUNCE
        app.dock?.bounce()

      when AppConstants.NOTIFY
        { message } = action
        switch process.platform
          when "win32"
            app.main_tray?.displayBalloon {
              title: "itch.io"
              content: message
            }
          else
            code = "new Notification(#{JSON.stringify(message)})"
            window.get()?.webContents?.executeJavaScript(code)

module.exports = { install }

