
app = require "app"
AppConstants = require "./constants/AppConstants"
AppDispatcher = require "./dispatcher/AppDispatcher"

install = ->
  AppDispatcher.register (action) ->

    switch action.action_type

      when AppConstants.SET_PROGRESS
        { alpha } = action
        percent = alpha * 100
        app.main_window?.setProgressBar(alpha)
        app.dock?.setBadge "#{percent.toFixed()}%"

      when AppConstants.CLEAR_PROGRESS
        app.main_window?.setProgressBar(-1)
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
            app.main_window?.webContents?.executeJavaScript(code)

module.exports = { install }

