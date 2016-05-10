
module Itch
  def Itch.ci_package_windows (arch, build_path)
    say "Creating installer + nupkg full/delta files"
    FileUtils.mkdir_p windows_installer_path
    ✓ grunt "create-windows-installer:#{arch_info['electron_arch']}"

    say "Copying artifacts to packages/"
    FileUtils.cp Dir["#{windows_installer_path}/#{app_name}-#{build_version}*.nupkg"], 'packages/'
    FileUtils.cp Dir["#{windows_installer_path}/*.exe"], 'packages/'
    FileUtils.cp Dir["#{windows_installer_path}/RELEASES"], 'packages/'
  end
end
