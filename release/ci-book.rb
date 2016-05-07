#!/usr/bin/env bundle exec ruby
# generate latest documentation for itch using gitbook
# and deploy it to google cloud storage.

require_relative 'common'

module Itch
  def Itch.ci_book
    show_versions %w(npm gsutil)

    ✓ npm_dep 'gitbook', 'gitbook-cli'

    cd 'docs' do
      ✓ npm 'install'
      ✓ sh 'gitbook build'
      ✓ gcp "_book/* gs://docs.itch.ovh/itch/#{build_ref_name}"
    end
  end
end

Itch.ci_book
