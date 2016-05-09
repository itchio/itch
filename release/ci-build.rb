#!/usr/bin/env ruby
# builds itch for production environemnts

require_relative 'common'

module Itch
  def Itch.ci_build
    say "Building #{app_name}"

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

    say "Copying node modules..."
    FileUtils.cp_r 'node_modules', stage_path
    say "Copying compiled code+assets..."
    FileUtils.cp_r 'app', stage_path

    say "Generating custom package.json + environment"
    pkg = JSON.parse(File.read('package.json'))
    %w(name productName desktopName).each do |field|
      pkg[field] = app_name
    end
    env = {
      "name" => "production",
      "channel" => channel_name
    }
    File.write("#{stage_path}/package.json", JSON.pretty_generate(pkg))
    File.write("#{stage_path}/app/env.js", JSON.pretty_generate(env))
  end
end

Itch.ci_build
