# compile javascript code and run unit tests

require_relative 'common'

module Itch
  def Itch.ci_test
    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    ✓ npm 'test'
    ✓ npm 'run coveralls'
  end
end

Itch.ci_test
