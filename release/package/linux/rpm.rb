
module Itch
  # RPM package
  def Itch.ci_package_rpm (arch, build_path)
    rpm_arch = to_rpm_arch arch
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
      --architecture "#{rpm_arch}" \
      --license "MIT" \
      --vendor "itch.io" \
      --category "games" \
      --after-install "release/debian-after-install.sh" \
      -d "p7zip" \
      -d "desktop-file-utils" \
    #{distro_files}
    }

    FileUtils.cp Dir["*.rpm"], "packages/"
  end
end

