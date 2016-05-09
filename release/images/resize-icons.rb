#!/usr/bin/env ruby

Dir["*-icons/"].each do |dir|
  %w(16 32 36 48 64 72 114 128 144 150 256 512 1024).each do |size|
    puts "#{dir}#{size}"
    system("convert #{dir}source.png -filter Lanczos -resize #{size}x#{size} #{dir}icon#{size}.png")
  end
end
