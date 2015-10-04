
React = require "react"

# Define a React component
module.exports = (definition) ->
  clazz = React.createClass(definition)
  factory = React.createFactory clazz
  factory._class = clazz
  factory

