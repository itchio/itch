#!/usr/bin/env ruby
# generate itch package for various platforms

require_relative 'common'
require_relative 'package/darwin'
require_relative 'package/windows'
require_relative 'package/linux'

module Itch
  VALID_OS = %w(windows darwin linux)
  WINSTALLER_PATH = "/c/jenkins/workspace/#{app_name}-installers"

  def Itch.ci_package (args)
    raise "ci-package expects two arguments" unless args.length == 2
    os, arch = args

    # for Gruntfile.js
    ENV['CI_CHANNEL'] = channel_name
    ENV['CI_WINDOWS_INSTALLER_PATH'] = "#{WINSTALLER_PATH}-#{arch}"

    say "Packaging #{app_name} for #{os}-#{arch}"
    OSES[os] or raise "Unknown os #{os}"
    arch_info = ARCHES[arch] or raise "Unknown arch #{arch}"

    say "Decompressing stage..."
    ✓ sh "tar xf stage.tar.gz"

    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    FileUtils.mkdir_p 'packages'

    say "Packaging with binary release"
    ✓ grunt "-v electron:#{os}-#{arch_info['electron_arch']}"
    build_path = "build/#{build_tag}/#{app_name}-#{os}-#{arch_info['electron_arch']}"

    case os

    when "windows"
      ci_package_windows arch, build_path

    when "darwin"
      ci_package_darwin arch, build_path

    when "linux"
      say ".deb package"
      ci_package_deb arch, build_path

      say ".rpm package"
      ci_package_rpm arch, build_path

      say "Portable binary archive"
      ci_package_linux_portable arch, build_path
    end
  end
end

Itch.ci_package ARGV

