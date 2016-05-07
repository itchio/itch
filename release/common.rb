
# base functions useful throughout CI scripts

require "colored"

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
    'go' => 'go version'
  }

  def Itch.show_versions (names)
    names.each do |name|
      v = `#{VERSION_SPECS[name]}`.strip
      puts %Q{★ #{name} #{v}}.yellow
    end
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

  def Itch.npm_dep (cmd, pkg)
    if system %Q{which #{cmd} > /dev/null}
      puts "★ got #{cmd}".yellow
      true
    else
      puts "☁ installing #{cmd}".yellow
      npm "install #{pkg}"
    end
  end

  def Itch.✓ (val)
    raise "Non-zero exit code, bailing out" unless val
  end

  def Itch.cd (dir)
    puts "☞ entering #{dir}"
    Dir.chdir(dir) do
      yield
    end
    puts "☜ leaving #{dir}"
  end

  def Itch.build_ref_name
    ENV['CI_BUILD_REF_NAME'] or raise "No build ref!"
  end
end
