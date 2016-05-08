#!/usr/bin/env ruby
# uploads .deb and .rpm files to bintray

require_relative 'common'

module Itch
  def Itch.ci_deploy_bintray
    say "Should deploy to Bintray!"
  end
end

Itch.ci_deploy_bintray
