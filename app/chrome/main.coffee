
_.str = s
_.str.formatBytes = do ->
  thresholds = [
    ["GB", Math.pow 1024, 3]
    ["MB", Math.pow 1024, 2]
    ["kB", 1024]
  ]

  (bytes) ->
    for [label, min] in thresholds
      if bytes >= min
        return "#{_.str.numberFormat bytes / min}#{label}"

    "#{_.str.numberFormat bytes} bytes"

document.addEventListener "DOMContentLoaded", ->
  Layout = require "./components/layout"
  React.render (Layout {}), document.body

window.addEventListener "beforeunload", ->
  React.unmountComponentAtNode document.body

window.addEventListener "keydown", (e) ->
  switch e.keyIdentifier
    when "F12"
      win = window.require("remote").getCurrentWindow()
      win.openDevTools()
    when "F5"
      return unless e.shiftKey
      window.location.reload()

