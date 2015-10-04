
React = require "react"

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

