#!/usr/bin/env ruby
# pushes an updated itch PKGBUILD to AUR

require_relative 'common'

module Itch
  def Itch.ci_deploy_aur
    say "Should deploy to AUR!"
  end
end

Itch.ci_deploy_aur
