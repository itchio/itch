
guard :shell, :all_on_start => true do
  watch %r{^.*\.coffee$} do |m|
    Guard::UI.info "Compiling #{m[0]}"
    `coffee -b -c #{m[0]}`
    if $?.success?
      n "Coffee compiled", "Yay", :success
    else
      n "Coffee error :(", "Oh no", :failed
    end
  end
  watch %r{^style\/.*\.scss$} do |m|
    Guard::UI.info "Compiling #{m[0]}"
    `cd style && sassc < main.scss > main.css`
    if $?.success?
      n "Scss compiled", "Yay", :success
    else
      n "Scss error :(", "Oh no", :failed
    end
  end
  watch %r{^src\/.*\/.*\.js$} do |m|
    Guard::UI.info "Concatenating src/main.js"
    files = (["src/init/pre.js"] + Dir.glob("src/**/*.js")).reject { |x| x =~ /main\.js$/ }.uniq
    `cat #{files.join " "} > src/main.js`
  end
end
