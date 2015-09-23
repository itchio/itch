
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
  LoginPage = require "./components/login_page"
  React.render (LoginPage {}), document.body

