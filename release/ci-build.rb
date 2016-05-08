#!/usr/bin/env ruby
# builds and generate itch package for various platforms

require_relative 'common'
require 'json'

module Itch
  VALID_OS = %w(windows darwin linux)

  def Itch.ci_build (args)
    raise "ci-build expects two arguments" unless args.length == 2
    os, arch = args

    say "Building #{app_name} for #{os}-#{arch}"
    os_info = OSES[os] or raise "Unknown os #{os}"
    arch_info = ARCHES[arch] or raise "Unknown arch #{arch}"

    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    say "Compiling JavaScript"
    ENV['NODE_ENV'] = 'production'
    ✓ grunt 'babel sass copy'

    say "Preparing stage"
    stage_path = 'stage'
    FileUtils.rm_rf stage_path
    FileUtils.mkdir_p stage_path

    pkg = JSON.parse(File.read('package.json'))
    env = {
      "name" => "production",
      "channel" => channel_name
    }
    pkg["name"] = app_name
    File.write("#{stage_path}/package.json", JSON.pretty_generate(pkg))
    File.write("#{stage_path}/app/env.js", JSON.pretty_generate(env))

    FileUtils.cp_r 'node_modules' stage_path
    FileUtils.cp_r 'app' stage_path

    FileUtils.mkdir_p 'build-artifacts'
    File.write "build-artifacts/something-#{os}-#{arch}", "#{Time.now}"

    ✓ grunt "-v electron:#{os}-#{arch_info['electron_arch']}"

    case os
    when "windows"
      installer_path = "/c/jenkins/workspace/#{app_name}-installers/"
      FileUtils.mkdir_p installer_path
      ENV['CI_WINDOWS_INSTALLER_PATH'] = installer_path
      ✓ grunt "-v create-windows-installer:#{arch_info['electron_arch']}"
    when "darwin"
      say "Should generate appdmg, etc."
    when "linux"
      say "Should generate deb, rpm, etc."
      build_path = "build/#{build_tag}/#{app_name}-#{arch_info['electron_arch']}
      ci_build_rpm build_path
    end
  end

  # Linux packaging
  def Itch.ci_build_rpm (build_path)
    say "Preparing stage2"
    stage2_path = 'stage2'
    FileUtils.rm_rf stage2_path
    FileUtils.mkdir_p stage2_path
    FileUtils.cp_r Dir["#{build_path}/*"] stage2_path

    release_date = Time.now.strftime('%Y-%m-%d')

    desktop = File.read("release/templates/itch.desktop.in")
    Dir.glob('app/static/locales/*.json').each do |loc_file|
      loc_data = JSON.parse(File.read(loc_file))
      if comm = loc_data['desktop.shortcut.comment']
        lang = File.basename(loc_file).gsub(/.json$/, '')
        desktop += "\nComment[#{lang}] = \"#{comm}\""
      end
    end
    File.write(desktop, "#{stage2_path}")

    gem_dep 'fpm', 'fpm'
  end

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
end

Itch.ci_build ARGV
