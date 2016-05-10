# base functions useful throughout CI scripts

# avert your eyes for a minute...
ENV['PATH'] += ":#{Gem.user_dir}/bin"
system 'bundle install' or raise 'Bundle install failed!'
require 'rubygems'
require 'bundler/setup'
ENV['LANG']='C'
ENV['LANGUAGE']='C'
ENV['LC_ALL']='C'
# all good! you may resume reading the code

require 'colored' # colors make me happy
require 'json' # parse a bunch of templates
require 'time' # rfc2822
require 'filesize' # bytes are for computers
require 'digest' # md5 sums for debian

module Itch
  HOMEPAGE = 'https://itch.io/app'
  MAINTAINER = 'Amos Wenger <amos@itch.io>'
  DESCRIPTION = 'The best way to play itch.io games'

  BUILD_TIME = Time.now.utc

  RETRY_COUNT = 5
  HOME = ENV['HOME']

  # Supported operating systems
  OSES = {
    'windows' => {

    },
    'darwin' => {

    },
    'linux' => {

    },
  }

  # Supported architectures
  ARCHES = {
    '386' => {
      'electron_arch' => 'ia32'
    },
    'amd64' => {
      'electron_arch' => 'x64'
    }
  }

  # local golang executables
  GOPATH = "#{HOME}/go"
  ENV['GOPATH'] = GOPATH
  FileUtils.mkdir_p GOPATH
  ENV['PATH'] += ":#{GOPATH}/bin"

  # local npm executables
  ENV['PATH'] += ":#{Dir.pwd}/node_modules/.bin"

  VERSION_SPECS = {
    '7za' => '7za | head -2',
    'node' => 'node --version',
    'npm' => 'npm --version',
    'gsutil' => 'gsutil --version',
    'go' => 'go version',
    'gothub' => 'gothub --version',
    'fakeroot' => 'fakeroot -v',
    'ar' => 'ar --version | head -1'
  }

  def Itch.putln (s)
    puts s
    $stdout.flush
    true
  end

  def Itch.show_versions (names)
    names.each do |name|
      v = ♫(VERSION_SPECS[name]).strip
      putln %Q{★ #{name} #{v}}.yellow
    end
  end

  def Itch.say (cmd)
    putln %Q{♦ #{cmd}}.yellow
  end

  def Itch.sh (cmd)
    putln %Q{· #{cmd}}.blue
    system cmd
  end

  def Itch.qsh (cmd)
    putln %Q{· <redacted>}.blue
    system cmd
  end

  # run npm command (silently)
  def Itch._npm (args)
    sh %Q{npm --no-progress --quiet #{args}}
  end

  # run pnpm command (silently)
  def Itch.npm (args)
    sh %Q{pnpm #{args}}
  end

  # run gem command
  def Itch.gem (args)
    sh %Q{gem #{args}}
  end

  # run grunt command
  def Itch.grunt (args)
    sh %Q{grunt #{args}}
  end

  # run go command
  def Itch.go (args)
    sh %Q{go #{args}}
  end

  # copy files to google cloud storage using gsutil
  def Itch.gcp (args)
    sh %Q{gsutil -m cp -r -a public-read #{args}}
  end

  # manage github assets
  def Itch.gothub (args)
    ENV['GITHUB_USER']='itchio'
    ENV['GITHUB_REPO']=app_name
    sh %Q{gothub #{args}}
  end

  # install a gem dep if missing
  def Itch.gem_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      putln "★ got #{cmd}".yellow
      true
    else
      putln "☁ installing #{cmd}".yellow
      gem "install #{pkg}"
    end
  end

  # install a node.js dep if missing
  def Itch._npm_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      putln "★ got #{cmd}".yellow
      true
    else
      putln "☁ installing #{cmd}".yellow
      _npm "install #{pkg}"
    end
  end

  def Itch.npm_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      putln "★ got #{cmd}".yellow
      true
    else
      putln "☁ installing #{cmd}".yellow
      npm "install #{pkg}"
    end
  end

  # install a golang project if missing
  def Itch.go_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      putln "★ got #{cmd}".yellow
      true
    else
      putln "☁ installing #{cmd}".yellow
      go "get #{pkg}"
    end
  end

  # enforce success of a command
  def Itch.✓ (val)
    raise "Non-zero exit code, bailing out" unless val
  end

  # retry command a few times before giving up
  def Itch.↻
    tries = 0
    while tries < RETRY_COUNT
      if tries > 0
        say "Command failed, waiting 30s then trying #{RETRY_COUNT - tries} more time(s)."
        sleep 30
      end
      return if yield # cmd returned truthy value, was successful
      tries += 1
    end
    raise "Tried #{RETRY_COUNT} times, bailing out"
  end

  # enforce success of a command & return output
  def Itch.♫ (cmd)
    out = `#{cmd}`
    code = $?.to_i
    raise "Non-zero exit code, bailing out" unless code == 0
    out
  end

  def Itch.cd (dir)
    putln "☞ entering #{dir}"
    Dir.chdir(dir) do
      yield
    end
    putln "☜ leaving #{dir}"
  end

  # environment variables etc.

  def Itch.build_ref_name
    ENV['CI_BUILD_REF_NAME'] or raise "No build ref!"
  end

  def Itch.build_tag
    ENV['CI_BUILD_TAG'] or raise "No build tag!"
  end

  def Itch.build_version
    build_tag.gsub(/^v/, '')
  end

  def Itch.app_name
    if /-canary$/ =~ build_tag
      return "kitch"
    else
      return "itch"
    end
  end

  def Itch.channel_name
    if /-canary$/ =~ build_tag
      return "canary"
    else
      return "stable"
    end
  end

  def Itch.build_time
    return BUILD_TIME
  end

  # much faster npm
  _npm_dep 'pnpm', 'pnpm'
end

