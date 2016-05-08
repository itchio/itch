#!/usr/bin/env ruby
# create upcoming github release whenever a tag is pushed.
# will remove existing release if any, allowing us to
# force-push tags gone bad. this is only useful for cosmetic
# reasons (no weird version number skips)

require_relative 'common'

module Itch
  def Itch.ci_deploy_github
    ✓ go_dep 'gothub', 'github.com/itchio/gothub'
    show_versions %w(gothub)

    raw_tags = ♫ %Q{git for-each-ref --sort=taggerdate --format '%(refname) %(taggerdate)' refs/tags}
    # refs/tags/v17.3.0-canary Sat May 7 15:46:38 2016 +0200
    # refs/tags/v17.3.0-canary
    # v17.3.0-canary
    all_tags = raw_tags.split("\n")
      .map { |x| x.split.first.split("/").last }

    relevant_tags = case channel_name
    when 'canary'
      all_tags.select { |x| x =~ /-canary$/ }
    when 'stable'
      all_tags.select { |x| x =~ /^[^-]+$/ }
    else
      raise "Unknown channel: #{channel_name}"
    end

    previous_tag = relevant_tags[-2] # last but one
    say "Creating changelog from #{previous_tag} to #{build_tag}"

    rawlog = ♫ %Q{git log --oneline --no-merges #{previous_tag}..#{build_tag}}
    # 83c7b2f :bug: Fix menu links
    #   * :bug: Fix menu links
    changelog = rawlog.split("\n")
      .reject { |x| x =~ /Translated using Weblate/ }
      .map { |x| x.gsub(/^\S+\s/, "  * ") }
      .join("\n")
    say "Changelog:\n#{changelog}"

    say "Deleting release if any..."
    gothub %Q{delete --tag #{build_tag}} or puts "First build for #{build_tag}"

    say "Creating release..."
    ✓ gothub %Q{release --tag #{build_tag} --draft --pre-release --description "#{changelog}"}

    say "Uploading assets..."
    asset_dir = 'build-artifacts'
    Dir.glob("#{asset_dir}/*").each do |name|
      ↻ do
        gothub %Q{upload --tag #{build_tag} --name '#{name}' --file '#{asset_dir}/#{name}' --replace}
      end
    end
  end
end

Itch.ci_deploy_github
