
Promise = require "bluebird"

path = require "path"

_ = require "underscore"

fs = Promise.promisifyAll require "fs"
glob = Promise.promisify require "glob"
read_chunk = Promise.promisify require "read-chunk"

log = (msg) -> console.log "[configurators/linux] #{msg}"

sniff_format = (buf) ->
  switch
    # ELF executables start with 0x7F454C46
    # (e.g. 0x7F + 'ELF' in ASCII)
    when buf[0] == 0x7F && buf[1] == 0x45 && buf[2] == 0x4C && buf[3] == 0x46
      'elf executable'

    # Shell scripts start with an interro-bang
    when buf[0] == 0x23 && buf[1] == 0x21
      'shell script'

# TODO: refactor + better error handling
find_and_fix_execs = (app_path) ->

  glob("#{app_path}/**/*", nodir: true).then((all_files) ->
      log "Probing #{all_files.length} files for executables"

      promises = all_files.map (file) ->
        read_chunk(file, 0, 8).then(sniff_format).then((format) ->
          return null unless format
          short_path = path.relative(app_path, file)
          log "#{short_path} looks like a #{format}, +x'ing it"
          fs.chmodAsync(file, 0o777).then ->
            file
        )
      Promise.all(promises).then((execs) ->
        execs.filter (x) -> x?
      )
  )

configure = (app_path) ->
  find_and_fix_execs(app_path).then((executables) ->
    { executables }
  )

module.exports = { configure }

