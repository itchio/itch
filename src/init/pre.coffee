
@I = {}
@R = {}

R.component = (name, data) ->
  data.trigger = ->
    I.trigger @, arguments...
    undefined

  data.dispatch = ->
    @detach = I.dispatch @, arguments...
    undefined

  data.displayName = "R.#{name}"
  cl = React.createClass(data)
  R[name] = React.createFactory(cl)
  R[name]._class = cl

# well this is dangerous
{
  div, span, a, p, ol, ul, li, strong, em, img, form, label, input, textarea,
  button, h1, h2, h3, h4, h5, h6
} = React.DOM

I.start = ->
  React.render (R.LoginPage {}), document.body

I.dispatch = (c, table) ->
  node = c.getDOMNode()
  console.log node

  wrapped = for own key, fn of table
    do (key, fn) ->
      [key, (event) -> fn event.detail, event]

  for [key, fn] in wrapped
    node.addEventListener key, fn, false

  detach = ->
    for [key, fn] in wrapped
      node.removeEventListener key, fn, false

  detach

I.trigger = (c, name, data) ->
  c.getDOMNode().dispatchEvent new CustomEvent name, {
    bubbles: true
    detail: data
  }

