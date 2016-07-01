#!/usr/bin/env ruby

system("convert itch-icons/source.png -modulate 100,100,15 kitch-icons/source.png")

Dir["*-icons/"].each do |dir|
  %w(16 32 36 48 64 72 114 128 144 150 256 512 1024).each do |size|
    puts "#{dir}#{size}"
    system("convert #{dir}source.png -filter Lanczos -resize #{size}x#{size} #{dir}icon#{size}.png")
  end
end

%w(itch kitch).each do |app|
  system("cp -f #{app}-icons/icon256.png ../../appsrc/static/images/tray/#{app}.png")
  system("cp -f #{app}-icons/icon16.png ../../appsrc/static/images/tray/#{app}-small.png")
end

puts "done - don't forget to optimize + .icns / .ico!"
