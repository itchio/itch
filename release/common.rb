# base functions useful throughout CI scripts

# avert your eyes for a minute...
system 'bundle install'
require 'rubygems'
require 'bundler/setup'
# all good! you may resume reading the code

require 'colored'

module Itch
  HOME = ENV['HOME']

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
    'gothub' => 'gothub --version'
  }

  def Itch.show_versions (names)
    names.each do |name|
      v = `#{VERSION_SPECS[name]}`.strip
      puts %Q{★ #{name} #{v}}.yellow
    end
  end

  def Itch.say (cmd)
    puts %Q{♦ #{cmd}}.yellow
  end

  def Itch.sh (cmd)
    puts %Q{· #{cmd}}.blue
    system cmd
  end

  # run npm command (silently)
  def Itch.npm (args)
    sh %Q{npm --no-progress --quiet #{args}}
  end

  # run grunt command
  def Itch.grunt (args)
    sh %Q{grunt #{args}}
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

  # install a node.js dep if missing
  def Itch.npm_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      puts "★ got #{cmd}".yellow
      true
    else
      puts "☁ installing #{cmd}".yellow
      npm "install #{pkg}"
    end
  end

  # install a golang project if missing
  def Itch.go_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      puts "★ got #{cmd}".yellow
      true
    else
      puts "☁ installing #{cmd}".yellow
      go "get #{pkg}"
    end
  end

  # enforce success of a command
  def Itch.✓ (val)
    raise "Non-zero exit code, bailing out" unless val
  end

  # enforce success of a command & return output
  def Itch.♫ (cmd)
    out = `#{cmd}`
    code = $?.to_i
    raise "Non-zero exit code, bailing out" unless code == 0
    out
  end

  def Itch.cd (dir)
    puts "☞ entering #{dir}"
    Dir.chdir(dir) do
      yield
    end
    puts "☜ leaving #{dir}"
  end

  # environment variables etc.

  def Itch.build_ref_name
    ENV['CI_BUILD_REF_NAME'] or raise "No build ref!"
  end

  def Itch.build_tag
    ENV['CI_BUILD_TAG'] or raise "No build tag!"
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
end
