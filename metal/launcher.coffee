
childProcess = require "child_process"

AppActions = require "./actions/AppActions"

sh = (cmd) ->
  console.log "sh #{cmd}"
  # pretty weak but oh well.
  forbidden = [";", "&&"]

  exe = childProcess.exec(cmd)
  exe.on 'exit', (code) ->
    AppActions.notify "Done playing! (#{process.platform})"

escape = (arg) ->
  '"' + arg.replace(/"/g, "\\\"") + '"'

launch = (exePath, args=[]) ->
  console.log "launching '#{exePath}' on '#{process.platform}' with args '#{args.join ' '}'"
  argstring = args.map((x) -> escape(x)).join ' '

  switch process.platform

    when "darwin"
      # '-W' waits for app to quit
      # potentially easy to inject something into the command line
      # here but then again we are running executables downloaded
      # from the internet.
      sh "open -W #{escape exePath} --args #{argstring}"

    when "win32"
      sh "#{escape exePath} #{argstring}"

    else
      # don't know how to launch, try to open with OS?
      shell = require "shell"
      shell.openItem(exePath)

module.exports = { launch }

