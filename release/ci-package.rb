#!/usr/bin/env ruby
# generate itch package for various platforms

require_relative 'common'

module Itch
  VALID_OS = %w(windows darwin linux)

  def Itch.ci_package (args)
    raise "ci-package expects two arguments" unless args.length == 2
    os, arch = args

    say "Packaging #{app_name} for #{os}-#{arch}"
    OSES[os] or raise "Unknown os #{os}"
    arch_info = ARCHES[arch] or raise "Unknown arch #{arch}"

    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    FileUtils.mkdir_p 'packages'
    File.write("packages/something-#{os}-#{arch}", "#{Time.now}")

    say "Packaging with binary release"
    ✓ grunt "electron:#{os}-#{arch_info['electron_arch']}"

    case os
    when "windows"
      installer_path = "/c/jenkins/workspace/#{app_name}-installers/"
      FileUtils.mkdir_p installer_path
      ENV['CI_WINDOWS_INSTALLER_PATH'] = installer_path
      ✓ grunt "create-windows-installer:#{arch_info['electron_arch']}"
    when "darwin"
      say "Should generate appdmg, etc."
    when "linux"
      say "Should generate deb, rpm, etc."
      # sic: itch, not app_name
      build_path = "build/#{build_tag}/itch-#{os}-#{arch_info['electron_arch']}"
      ✓ sh "tar cfJ packages/#{app_name}-#{build_tag}-#{arch}.tar.xz #{build_path}"
      ci_build_deb build_path
      ci_build_rpm build_path
    end
  end

  def Itch.prepare_stage2 (build_path, stage2_path)
    FileUtils.rm_rf stage2_path
    FileUtils.mkdir_p stage2_path

    # create base directories
    say "Creating base directories"
    %w(/usr/games /usr/lib/itch /usr/share/applications /usr/share/doc/itch /usr/share/man/man6).each do |path|
      FileUtils.mkdir_p "#{stage2_path}#{path}"
    end

    say "Copying binaries"
    FileUtils.cp_r Dir["#{build_path}/*"], "#{stage2_path}/usr/lib/itch/"

    say "Copying linux extras"
    FileUtils.cp "linux-extras/#{app_name}.desktop",
      "#{stage2_path}/usr/share/applications/#{app_name}.desktop"

    FileUtils.cp "linux-extras/#{app_name}.6",
      "#{stage2_path}/usr/share/man/man6/#{app_name}.6"
  end

  # APT package
  def Itch.ci_build_deb (build_path)
    show_versions %w(fakeroot ar)

    say "Preparing stage2"
    stage2_path = 'deb-stage'
    prepare_stage2 build_path, stage2_path
    FileUtils.mkdir_p "#{stage2_path}/usr/share/lintian/overrides"

    say "deb: stub!"
  end

  # RPM package
  def Itch.ci_build_rpm (build_path)
    gem_dep 'fpm', 'fpm'

    say "Preparing stage2"
    stage2_path = 'rpm-stage'
    prepare_stage2 build_path, stage2_path

    release_date = Time.now.strftime('%Y-%m-%d')

    say "rpm: stub!"
  end
end

Itch.ci_package ARGV

