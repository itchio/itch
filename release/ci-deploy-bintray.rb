#!/usr/bin/env ruby
# uploads .deb and .rpm files to bintray

require_relative 'common'

module Itch
  def Itch.ci_deploy_bintray
    say "Should deploy to Bintray!"
    ✓ gem_dep 'dpl', 'dpl'

    FileUtils.mkdir_p "build"

    release_date = Time.now.strftime('%Y-%m-%d')
    %w(rpm deb).each do |repo|
      %w(386 amd64).each do |arch|
        say "Uploading #{arch} to #{repo} repo..."
        deb_arch = to_deb_arch arch
        rpm_arch = case arch
                   when "386" then "i386"
                   when "amd64" then "x86_64"
                   else raise "Unsupported arch #{arch}"
                   end

        publish = (channel_name != 'stable')
        say "(and publishing)" if publish

        conf = File.read("release/templates/bintray.#{repo}.json.in")
        conf = conf.gsub "{{CI_APPNAME}}", app_name
        conf = conf.gsub "{{CI_VERSION}}", build_version
        conf = conf.gsub "{{CI_RELEASE_DATE}}", release_date
        conf = conf.gsub "{{CI_PUBLISH}}", publish.to_s
        conf = conf.gsub "{{DEB_ARCH}}", deb_arch
        conf = conf.gsub "{{RPM_ARCH}}", rpm_arch
        File.write("build/bintray.json", conf)

        ✓ qsh %Q{dpl --provider=bintray --file=build/bintray.json --user=fasterthanlime --key="#{ENV['BINTRAY_TOKEN']}"}
      end # 386, amd64
    end # deb, rpm
  end
end

Itch.ci_deploy_bintray
