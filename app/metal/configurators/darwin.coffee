
Promise = require "bluebird"

path = require "path"

_ = require "underscore"

fs = Promise.promisifyAll require "fs"
glob = Promise.promisify require "glob"
read_chunk = Promise.promisify require "read-chunk"

log = (msg) -> console.log "[configurators/darwin] #{msg}"

# skip some typical junk we find in archives that's supposed
# to be hidden / in trash / isn't in anyway relevant to what
# we're trying to do
skip_junk = (bundle_paths, app_path) ->
  bundle_paths.filter((file) ->
    !/^__MACOSX/.test(path.relative(app_path, file))
  )

sniff_format = (buf) ->
  switch
    # intel Mach-O executables start with 0xCEFAEDFE
    # (old PowerPC Mach-O executables started with 0xFEEDFACE)
    when buf[0] == 0xCE && buf[1] == 0xFA && buf[2] == 0xED && buf[3] == 0xFE
      'mach-o executable'

    # Mach-O universal binaries start with 0xCAFEBABE
    # it's Apple's 'fat binary' stuff that contains multiple architectures
    when buf[0] == 0xCA && buf[1] == 0xFE && buf[2] == 0xBA && buf[3] == 0xBE
      'mach-o universal binary'

    # Shell-script start with an interro-bang
    when buf[0] == 0x23 && buf[1] == 0x21
      'shell script'

# TODO: refactor + better error handling
fix_permissions = (bundle_path) ->

  glob("#{bundle_path}/**/*", nodir: true).then((all_files) ->
      log "Probing #{all_files.length} files for executables"
      all_files
  ).map((file) ->
      read_chunk(file, 0, 8).then(sniff_format).then((format) ->
        return unless format
        short_path = path.relative(bundle_path, file)
        log "#{short_path} looks like a #{format}, +x'ing it"
        fs.chmodAsync file, 0o777
      )
  , concurrency: 4).then -> bundle_path

configure = (app_path) ->
  glob("#{app_path}/**/*.app/").then((bundle_paths) ->
    skip_junk bundle_paths, app_path
  ).then((bundle_paths) ->
    Promise.all bundle_paths.map fix_permissions
  ).then((executables) ->
    { executables }
  )

module.exports = { configure }

