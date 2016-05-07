#!/usr/bin/env bundle exec ruby
# compile javascript code and run unit tests

require_relative 'common'

module Itch
  def Itch.ci_test
    show_versions %w(npm node go)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    ✓ grunt 'copy sass babel'
    ✓ npm 'test'
    ✓ npm 'run coveralls'
  end
end

Itch.ci_test
