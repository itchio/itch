
childProcess = require "child_process"

AppActions = require "./actions/AppActions"

sh = (cmd) ->
  # pretty weak but oh well.
  forbidden = [";", "&&"]

  exe = childProcess.exec(cmd)
  exe.on 'exit', (code) ->
    AppActions.notify "Done playing! (#{process.platform})"

launch = (exePath, args=[]) ->
  switch process.platform

    when "darwin"
      # '-W' waits for app to quit
      # potentially easy to inject something into the command line
      # here but then again we are running executables downloaded
      # from the internet.
      argstring = args.map((x) -> "'#{x}'").join(" ")
      sh "open -W '#{exePath}' --args #{argstring}"

    when "win32"
      argstring = args.map((x) -> "\"#{x}\"").join(" ")
      sh "\"#{exePath}\" #{argstring}"

    else
      # don't know how to launch, try to open with OS?
      shell = require "shell"
      shell.openItem(exePath)

module.exports = { launch }

