
require 'tempfile'

guard :shell, :all_on_start => true do
  watch %r{^.*\.coffee$} do |m|
    Guard::UI.info "Compiling #{m[0]}"
    `coffee -b -c #{m[0]}`
  end
  watch %r{^style\/main\.scss$} do |m|
    Guard::UI.info "Compiling #{m[0]}"
    `cd style && sassc < main.scss > main.css`
    n "Style updated!", "Yay"
  end
  watch %r{^src\/.*\/.*\.js$} do |m|
    Guard::UI.info "Concatenating src/main.js"
    files = (["src/init/pre.js"] + Dir.glob("src/**/*.js")).uniq
    `cat #{files.join " "} > src/main.js`
    n "UI Updated!", "Yay"
    nil
  end
end
