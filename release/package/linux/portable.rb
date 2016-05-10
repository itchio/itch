
module Itch
  def Itch.ci_package_linux_portable (arch, build_path)
    say "Generating portable linux archive (.tar.xz)"
    result = "packages/#{app_name}-#{build_version}-#{arch}.tar.xz"
    ✓ sh "tar cfJ #{result} #{build_path}"
  end
end

