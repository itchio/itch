
module Itch
  def Itch.ci_package_windows (arch, build_path)
    say "Creating installer + nupkg full/delta files"
    FileUtils.mkdir_p WINSTALLER_PATH
    ✓ grunt "create-windows-installer:#{ARCHES[arch]['electron_arch']}"

    say "Copying artifacts to packages/"
    FileUtils.cp Dir["#{WINSTALLER_PATH}/#{app_name}-#{build_version}*.nupkg"], 'packages/'
    FileUtils.cp Dir["#{WINSTALLER_PATH}/*.exe"], 'packages/'
    FileUtils.cp Dir["#{WINSTALLER_PATH}/RELEASES"], 'packages/'
  end
end
