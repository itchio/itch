
guard :shell, :all_on_start => true do
  watch %r{^style\/.*\.scss$} do |m|
    Guard::UI.info "Compiling #{m[0]}"
    `cd style && sassc < main.scss > main.css`
    if $?.success?
      n "Scss compiled", "Yay", :success
    else
      n "Scss error :(", "Oh no", :failed
    end
  end

  watch %r{^.*\.coffee$} do |m|
    Guard::UI.info "Compiling #{m[0]}"
    `coffee -b -c #{m[0]}`
    if $?.success?
      n "Coffee compiled", "Yay", :success
    else
      n "Coffee error :(", "Oh no", :failed
    end
  end

  watch %r{^chrome\/.*\/.*\.js$} do |m|
    Guard::UI.info "Concatenating chrome/chrome.js"
    files = (["chrome/init/pre.js"] + Dir.glob("chrome/**/*.js")).reject { |x| x =~ /chrome\.js$/ }.uniq
    `cat #{files.join " "} > chrome/chrome.js`
  end
end
