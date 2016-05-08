#!/usr/bin/env ruby
# builds and generate itch package for various platforms

require_relative 'common'

module Itch
  VALID_OS = %w(windows darwin linux)

  def Itch.ci_build (args)
    raise "ci-build expects two arguments" unless args.length == 2
    os, arch = args

    say "Building #{app_name} for #{os}-#{arch}"
    os_info = OSES[os] or raise "Unknown os #{os}"
    arch_info = ARCHES[atch] or raise "Unknown arch #{arch}"
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
      electron_arch: 'ia32'
    },
    'amd64' => {
      electron_arch: 'x64'
    }
  }
end

Itch.ci_build ARGV
