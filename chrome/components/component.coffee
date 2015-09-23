
# Define a React component
module.exports = (data) ->
    clazz = React.createClass(data)
    factory = React.createFactory clazz
    factory._class = clazz
    factory

