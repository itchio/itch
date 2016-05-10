#!/usr/bin/env ruby

require_relative 'common'

module Itch
  def Itch.ci_push_tag
    force = false

    pkg_path = File.expand_path(File.join(
      File.dirname(__FILE__), '..', 'package.json'))

    pkg = JSON.parse(File.read(pkg_path))
    pkg_version = pkg['version']

    force = false
    args = []
    ARGV.each do |arg|
      case arg
      when "--force"
        say "(Running in forced mode)"
        force = true
      when /^--/
        raise "Unknown option #{arg}"
      else
        args << arg
      end
    end

    version_input = args[0] or prompt "Package version is: #{pkg['version']}, type yours"
    unless /^v\d+.\d+.\d+(-canary)?$/ =~ version_input
      raise "Version must be of the form vX.Y.Z(-canary)?"
    end

    next_version = version_input.gsub(/^v/, '')

    if pkg_version != next_version
      force or yesno "Bump package.json? [#{pkg_version} => #{next_version}]"
      pkg['version'] = next_version
      File.write(pkg_path, JSON.pretty_generate(pkg))
      say "Bumped package.json"
      ✓ sh %Q{git add package.json}
      ✓ sh %Q{git commit -m ':arrow_up: #{next_version}'}
    end

    tag = "v#{next_version}"
    add_cmd = %Q{git tag -s -a #{tag} -m #{tag}}

    if system add_cmd
      say "Tag added..."
    else
      force or yesno "Tag already exists locally. Replace?"
      ✓ sh %Q{git tag -d #{tag}}
      ✓ sh add_cmd
    end

    push_cmd = %Q{git push origin #{tag}}
    if system push_cmd
      say "Tag pushed..."
    else
      force or yesno "Tag already exists on remote. Force-push?"
      ✓ sh %Q{#{push_cmd} --force}
    end

    ✓ sh %Q{git push}
  end
end

Itch.ci_push_tag

