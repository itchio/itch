
module Itch
  # APT package
  def Itch.ci_package_deb (arch, build_path)
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
end

