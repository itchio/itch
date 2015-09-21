
require 'tempfile'

guard :shell, :all_on_start => true do
  watch %r{^.*\.coffee$} do |m|
    puts "Compiling #{m[0]}"
    `coffee -b -c #{m[0]}`
  end
  watch %r{^style\/main\.scss$} do |m|
    puts "Compiling #{m[0]}"
    `cd style && sassc < main.scss > main.css`
  end
  watch %r{^src\/.*\/.*\.js$} do |m|
    puts "Concatenating src/main.js"
    files = (["src/init/pre.js"] + Dir.glob("src/**/*.js")).uniq
    `cat #{files.join " "} > main.js`
  end
end
