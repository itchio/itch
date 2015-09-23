
module.exports = {
  ext: (filename) ->
    filename.toLowerCase().match(/\.[\w]+$/)

  exeGlob: (appPath) ->
    switch process.platform
      when "win32"
        "#{appPath}/**/*.exe"
      when "darwin"
        "#{appPath}/**/*.app"
      when "linux"
        "#{appPath}/**/*.sh"
      else
        throw new Error("Unsupported platform: #{process.platform}")
}

