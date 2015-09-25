
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
  console.log "Window close or reload"
  React.unmountComponentAtNode document.body

