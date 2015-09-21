
@I = {}
@R = {}

R.component = (name, data) ->
  data.displayName = "R.#{name}"
  cl = React.createClass(data)
  R[name] = React.createFactory(cl)
  R[name]._class = cl

# well this is dangerous - leaf
# why ? - amos
{
  div, span, a, p, ol, ul, li, strong, em, img, form, label, input, textarea,
  button, h1, h2, h3, h4, h5, h6
} = React.DOM

I.start = ->
  React.render (R.LoginPage {}), document.body

