
require_relative 'linux/deb'
require_relative 'linux/rpm'
require_relative 'linux/portable'

module Itch
  def Itch.prepare_stage2 (build_path, stage2_path)
    FileUtils.rm_rf stage2_path
    FileUtils.mkdir_p stage2_path

    # create base directories
    say "Creating base directories"
    %W(/usr/games /usr/bin /usr/lib/#{app_name} /usr/share/applications /usr/share/doc/#{app_name} /usr/share/man/man6).each do |path|
      FileUtils.mkdir_p "#{stage2_path}#{path}"
    end

    say "Copying binaries"
    FileUtils.cp_r Dir["#{build_path}/*"], "#{stage2_path}/usr/lib/#{app_name}/"

    FileUtils.ln_s "../lib/#{app_name}/#{app_name}", "#{stage2_path}/usr/bin/#{app_name}"

    say "Copying icons"
    %w(16 32 48 64 128 256 512).each do |size|
      dir = "#{stage2_path}/usr/share/icons/hicolor/#{size}x#{size}/apps"
      FileUtils.mkdir_p dir
      FileUtils.cp "release/images/#{app_name}-icons/icon#{size}.png", "#{dir}/#{app_name}.png"
    end

    say "Copying linux extras"
    FileUtils.cp "linux-extras/#{app_name}.desktop",
    "#{stage2_path}/usr/share/applications/#{app_name}.desktop"

    FileUtils.cp "linux-extras/#{app_name}.6",
    "#{stage2_path}/usr/share/man/man6/#{app_name}.6"
  end
end

