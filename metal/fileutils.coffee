
module.exports = {
  # return '.zip', '.exe', etc given any file path. Always lowercase.
  ext: (filename) ->
    filename.toLowerCase().match(/\.[\w]+$/)

  exe_glob: (app_path) ->
    switch process.platform
      when "win32"
        "#{app_path}/**/*.exe"
      when "darwin"
        "#{app_path}/**/*.app"
      when "linux"
        # That's.. far from enough
        "#{app_path}/**/*.sh"
      else
        throw new Error("Unsupported platform: #{process.platform}")
}

