#!/usr/bin/env ruby
# generate itch package for various platforms

require_relative 'common'

module Itch
  VALID_OS = %w(windows darwin linux)

  def Itch.ci_generate_linux_extras
    FileUtils.rm_rf "linux-extras"
    FileUtils.mkdir_p "linux-extras"

    # generate .desktop file
    say "Generating desktop file"
    desktop = File.read("release/templates/itch.desktop.in")
    Dir.glob('app/static/locales/*.json').each do |loc_file|
      loc_data = JSON.parse(File.read(loc_file))
      if comm = loc_data['desktop.shortcut.comment']
        lang = File.basename(loc_file).gsub(/.json$/, '')
        next if lang =~ /englitch/
        desktop += "Comment[#{lang}]=\"#{comm}\"\n"
      end
    end
    desktop = desktop.gsub("{{APPNAME}}", app_name)
    File.write("linux-extras/#{app_name}.desktop", desktop)

    # man page
    say "Generating man file"
    # will this fail with funny locales?
    month = build_time.strftime('%^B') # ^B is (obviously) for uppercase month name
    year = build_time.strftime('%Y')
    man = File.read("release/templates/itch.6.in")
    man = man.gsub("{{APPNAME}}", app_name.upcase)
    man = man.gsub("{{MONTH}}", month)
    man = man.gsub("{{YEAR}}", year)
    File.write("linux-extras/#{app_name}.6", man)
  end
end

Itch.ci_generate_linux_extras


