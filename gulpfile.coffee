
gulp = require('gulp')
sass = require('gulp-sass')
gutil = require('gulp-util')
coffee = require('gulp-coffee')
plumber = require('gulp-plumber')
streamify = require('gulp-streamify')
plumberNotifier = require('gulp-plumber-notifier')
concat = require('gulp-concat')
assign = require('lodash.assign')
watchify = require('gulp-watchify')
coffeeify = require('coffeeify')
envify = require('envify')

paths = {
  chrome: [ './chrome/main.coffee' ]
  metal: [
    './main.coffee'
    './metal/**/*.coffee'
  ]
  scss: [ './style/**/*.scss' ]
}

###
# Compile and bundle chrome code with watchify
###

# Hack to enable configurable watchify watching
watching = false
gulp.task 'enable-watch-mode', -> watching = true

gulp.task 'chrome', watchify((watchify) ->
  gulp.src(paths.chrome)
    .pipe(plumberNotifier())
    .pipe(watchify {
      watch: watching
      extensions: [
        '.coffee'
        '.js'
      ]
      setup: (bundle) ->
        bundle.transform coffeeify
        bundle.transform envify
    })
    .pipe(streamify(concat('bundle.js')))
    .pipe gulp.dest('./chrome/')
)

###
# Compile metal code in-place with coffee-script
###

gulp.task 'metal', ->
  gulp.src(paths.metal, base: './')
    .pipe(plumberNotifier())
    .pipe(coffee().on('error', gutil.log))
    .pipe gulp.dest('.')

###
# Compile css with sass
###

gulp.task 'scss', ->
  gulp.src('style/main.scss')
    .pipe(plumberNotifier())
    .pipe(sass())
    .pipe gulp.dest('style')

###
# Watch all code changes and recompile on-demand
###

gulp.task 'watch', [ 'enable-watch-mode' ], ->
  gulp.watch paths.metal, [ 'metal' ]
  gulp.watch paths.scss, [ 'scss' ]
  gulp.start 'chrome'

gulp.task 'all', [
  'metal'
  'chrome'
  'scss'
]
gulp.task 'default', [ 'all' ]

