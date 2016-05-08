#!/usr/bin/env ruby
# lint javascript code and run unit tests

require_relative 'common'

module Itch
  def Itch.ci_lint
    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    ✓ npm 'run lint'
  end
end

Itch.ci_test
