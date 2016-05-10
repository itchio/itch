
module Itch
  def Itch.ci_package_darwin (arch, build_path)
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
  end
end
