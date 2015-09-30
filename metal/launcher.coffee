
path = require "path"
child_process = require "child_process"
Promise = require "bluebird"

AppActions = require "./actions/AppActions"

sh = (exe_path, cmd) ->
  new Promise (resolve, reject) ->
    console.log "sh #{cmd}"

    # pretty weak but oh well.
    forbidden = [";", "&&"]
    for bidden in forbidden
      if cmd.indexOf(bidden) >= 0
        throw new Error "Command-line contains forbidden characters: #{cmd}"

    wd = path.dirname(exe_path)
    console.log "Working directory: #{wd}"
    exe = child_process.exec cmd, {
      stdio: [ 0, 'pipe', 'pipe' ]
      maxBuffer: 5000 * 1024
      cwd: wd
    }, (error, stdout, stderr) ->
      if error
        console.log "#{exe_path} returned #{error}"
        console.log "stdout: "
        console.log stdout
        console.log "stderr: "
        console.log stderr
        reject { exe_path, error }
      else
        resolve "Done playing #{exe_path}!"

escape = (arg) ->
  '"' + arg.replace(/"/g, "\\\"") + '"'

launch = (exe_path, args=[]) ->
  console.log "launching '#{exe_path}' on '#{process.platform}' with args '#{args.join ' '}'"
  arg_string = args.map((x) -> escape(x)).join ' '

  switch process.platform

    when "darwin"
      # '-W' waits for app to quit
      # potentially easy to inject something into the command line
      # here but then again we are running executables downloaded
      # from the internet.
      sh exe_path, "open -W #{escape exe_path} --args #{arg_string}"

    when "win32"
      sh exe_path, "#{escape exe_path} #{arg_string}"

    else
      # don't know how to launch, try to open with OS?
      shell = require "shell"
      shell.openItem(exe_path)

module.exports = { launch }

