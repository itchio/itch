#!/usr/bin/env ruby
# generate itch package for various platforms

require_relative 'common'

module Itch
  VALID_OS = %w(windows darwin linux)

  def Itch.ci_package (args)
    raise "ci-package expects two arguments" unless args.length == 2
    os, arch = args

    # for Gruntfile.js
    ENV['CI_CHANNEL'] = channel_name
    windows_installer_path = "/c/jenkins/workspace/#{app_name}-installers/"
    ENV['CI_WINDOWS_INSTALLER_PATH'] = windows_installer_path

    say "Packaging #{app_name} for #{os}-#{arch}"
    OSES[os] or raise "Unknown os #{os}"
    arch_info = ARCHES[arch] or raise "Unknown arch #{arch}"

    say "Decompressing stage..."
    ✓ sh "tar xf stage.tar.gz"

    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    FileUtils.mkdir_p 'packages'

    say "Packaging with binary release"
    ✓ grunt "-v electron:#{os}-#{arch_info['electron_arch']}"
    build_path = "build/#{build_tag}/#{app_name}-#{os}-#{arch_info['electron_arch']}"

    case os

    when "windows"
      FileUtils.mkdir_p windows_installer_path
      ✓ grunt "create-windows-installer:#{arch_info['electron_arch']}"

      FileUtils.cp Dir["#{windows_installer_path}/#{app_name}-#{build_version}*.nupkg"], 'packages/'
      FileUtils.cp Dir["#{windows_installer_path}/*.exe"], 'packages/'
      FileUtils.cp Dir["#{windows_installer_path}/RELEASES"], 'packages/'

    when "darwin"
      show_versions %w(7za)
      ✓ npm_dep 'appdmg', 'appdmg'

      say "Signing Application bundle..."
      sign_key = 'Developer ID Application: Amos Wenger (B2N6FSRTPV)'
      ✓ sh %Q{ditto -v #{build_path}/#{app_name}.app #{app_name}.app}
      ✓ sh %Q{codesign --deep --force --verbose --sign "#{sign_key}" #{app_name}.app}
      ✓ sh %Q{codesign --verify -vvvv #{app_name}.app}
      ✓ sh %Q{spctl -a -vvvv #{app_name}.app}

      say "Compressing .zip archive"
      ✓ sh "7za a packages/#{app_name}-mac.zip #{app_name}.app"

      say "Creating .dmg volume"
      dmgjson = JSON.parse(File.read("release/templates/appdmg.json.in"))
      dmgjson = {
        "title" => app_name,
        "icon" => "../release/images/#{app_name}-icons/itch.icns", # sic. it's really itch.icns
        "background" => "../release/images/dmgbg.png",
        "icon-size" => 80,

        "contents" => [
          { "x" => 190, "y" => 382, "type" => "file", "path" => "../#{app_name}.app" },
          { "x" => 425, "y" => 382, "type" => "link", "path" => "/Applications" }
        ]
      }
      File.write("build/appdmg.json", JSON.pretty_generate(dmgjson))

      ✓ sh "appdmg build/appdmg.json packages/#{app_name}-mac.dmg"

    when "linux"
      ci_build_deb arch, build_path
      ci_build_rpm arch, build_path

      say "Generating portable linux archive (.tar.xz)"
      ✓ sh "tar cfJ packages/#{app_name}-#{build_version}-#{arch}.tar.xz #{build_path}"
    end
  end

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

  # APT package
  def Itch.ci_build_deb (arch, build_path)
    show_versions %w(fakeroot ar)

    say "Preparing stage2"
    stage2_path = 'deb-stage'
    prepare_stage2 build_path, stage2_path
    FileUtils.mkdir_p "#{stage2_path}/DEBIAN"
    FileUtils.mkdir_p "#{stage2_path}/usr/share/lintian/overrides"

    say "Copying copyright"
    FileUtils.cp "release/debian/copyright",
      "#{stage2_path}/usr/share/doc/#{app_name}/"

    say "Copying lintian overrides"
    FileUtils.cp "release/debian/lintian-overrides",
      "#{stage2_path}/usr/share/lintian/overrides/#{app_name}"

    say "Copying license..."
    FileUtils.rm "#{stage2_path}/usr/lib/#{app_name}/LICENSE"
    FileUtils.mv "#{stage2_path}/usr/lib/#{app_name}/LICENSES.chromium.html",
      "#{stage2_path}/usr/share/doc/#{app_name}/LICENSE"

    say "Generating changelog..."
    changelog = File.read("release/debian/changelog.in")
    changelog = changelog.gsub("{{APPNAME}}", app_name)
    changelog = changelog.gsub("{{VERSION}}", build_version)
    changelog = changelog.gsub("{{DATE}}", build_time.rfc2822)
    File.write("#{stage2_path}/usr/share/doc/#{app_name}/changelog", changelog)

    say "Compressing man page & changelog"
    ✓ sh "gzip -f9 #{stage2_path}/usr/share/doc/#{app_name}/changelog #{stage2_path}/usr/share/man/man6/#{app_name}.6"

    installed_size = Dir.glob("#{stage2_path}/**/*").map do |f|
      File::Stat.new(f).size
    end.inject(0, :+)
    say "deb installed size: #{Filesize.from("#{installed_size} B").pretty}"

    say "Generating control file..."

    # note: update dependencies from time to time
    control = <<EOF
Package: #{app_name}
Version: #{build_version}
Architecture: #{arch}
Maintainer: #{MAINTAINER}
Installed-Size: #{(installed_size / 1024.0).ceil.to_i}
Depends: gconf-service, libasound2 (>= 1.0.16), libatk1.0-0 (>= 1.12.4), libc6 (>= 2.12), libcairo2 (>= 1.6.0), libcups2 (>= 1.4.0), libdbus-1-3 (>= 1.2.14), libexpat1 (>= 2.0.1), libfontconfig1 (>= 2.9.0), libfreetype6 (>= 2.4.2), libgcc1 (>= 1:4.1.1), libgconf-2-4 (>= 2.31.1), libgdk-pixbuf2.0-0 (>= 2.22.0), libglib2.0-0 (>= 2.31.8), libgtk2.0-0 (>= 2.24.0), libnotify4 (>= 0.7.0), libnspr4 (>= 2:4.9-2~) | libnspr4-0d (>= 1.8.0.10), libnss3 (>= 2:3.13.4-2~) | libnss3-1d (>= 3.12.4), libpango-1.0-0 (>= 1.14.0), libpangocairo-1.0-0 (>= 1.14.0), libstdc++6 (>= 4.6), libx11-6 (>= 2:1.4.99.1), libxcomposite1 (>= 1:0.3-1), libxcursor1 (>> 1.1.2), libxdamage1 (>= 1:1.1), libxext6, libxfixes3, libxi6 (>= 2:1.2.99.4), libxrandr2 (>= 2:1.2.99.2), libxrender1, libxtst6, p7zip-full
Section: games
Priority: optional
Homepage: #{HOMEPAGE}
Description: install and play itch.io games easily
  The goal of this project is to give you a desktop application that you can
  download and run games from itch.io with. Additionally you should be able to
  update games and get notified when games are updated. The goal is not to
  replace the itch.io website.
EOF
    File.write("#{stage2_path}/DEBIAN/control", control)

    cd stage2_path do
      say "Computing md5sums..."
      sums = ""
      Dir["usr/**/*"].each do |f|
        next unless File.file?(f)
        sums += "#{Digest::MD5.file(f)} #{f}\n"
      end
      File.write("DEBIAN/md5sums", sums)

      say "Fixing permissions..."
      Dir["usr/**/*"].each do |f|
        case File.stat(f).mode & 0777
        when 0775
          File.chmod(0755, f)
        when 0664
          File.chmod(0644, f)
        end
      end

      say "Compressing files..."
      cd "DEBIAN" do
        ✓ sh "fakeroot tar cfz ../control.tar.gz ."
      end

      FileUtils.mkdir "data"
      FileUtils.mv "usr", "data/"
      cd "data" do
        ✓ sh "fakeroot tar cfJ ../data.tar.xz ."
      end

      deb="../packages/#{app_name}_#{build_version}_#{arch}.deb"
      FileUtils.rm_f deb
      File.write("debian-binary", "2.0\n")
      ✓ sh "ar cq #{deb} debian-binary control.tar.gz data.tar.xz"
    end
  end

  # RPM package
  def Itch.ci_build_rpm (arch, build_path)
    gem_dep 'fpm', 'fpm'

    say "Preparing stage2"
    stage2_path = 'rpm-stage'
    prepare_stage2 build_path, stage2_path

    distro_files = ".=/"

    ✓ sh %Q{fpm --force \
      -C #{stage2_path} -s dir -t rpm \
      --rpm-compression xz \
      --name "#{app_name}" \
      --description "#{DESCRIPTION}" \
      --url "https://itch.io/app" \
      --version "#{build_version}" \
      --maintainer "#{MAINTAINER}" \
      --architecture "#{arch}" \
      --license "MIT" \
      --vendor "itch.io" \
      --category "games" \
      --after-install "release/debian-after-install.sh" \
      -d "p7zip" \
      -d "desktop-file-utils" \
      #{distro_files}
    }
  end
end

Itch.ci_package ARGV

