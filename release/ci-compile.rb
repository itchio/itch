# compile itch for production environemnts

require_relative 'common'

module Itch
  def Itch.ci_compile
    say "Compiling #{app_name}"

    show_versions %w(npm node)

    ✓ npm_dep 'grunt', 'grunt-cli'
    ✓ npm 'install'

    say "Compiling JavaScript"
    ENV['NODE_ENV'] = 'production'
    ✓ grunt 'babel sass copy'

    say "Preparing stage"
    stage_path = 'stage'
    FileUtils.rm_rf stage_path
    FileUtils.mkdir_p stage_path

    say "Copying compiled code+assets..."
    FileUtils.cp_r 'app', stage_path
    FileUtils.cp_r 'node_modules', stage_path

    say "Generating custom package.json + environment"
    pkg = JSON.parse(File.read('package.json'))
    %w(name productName desktopName).each do |field|
      pkg[field] = app_name
    end
    env = {
      "name" => "production",
      "channel" => channel_name
    }
    File.write("#{stage_path}/package.json", JSON.pretty_generate(pkg))

    envjs = %Q{
module.exports = #{JSON.pretty_generate(env)}
}
    File.write("#{stage_path}/app/env.js", envjs)

    ✓ sh "tar cfz stage.tar.gz stage"
  end
end

Itch.ci_compile
