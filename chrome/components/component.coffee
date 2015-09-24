
# TODO: Import React via browserify, not bower + explicit HTML include
# TODO: use PureRenderMixin in there

# Define a React component
module.exports = (definition) ->
  definition.shouldComponentUpdate or= (newProps, newState) ->
    @props.data != newProps.data

  clazz = React.createClass(definition)
  factory = React.createFactory clazz

  wrapper = (data, args...) ->
    factory { data }, args...

  wrapper._class = clazz
  wrapper

