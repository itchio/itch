
var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var plumber = require('gulp-plumber');
var streamify = require('gulp-streamify');
var plumberNotifier = require('gulp-plumber-notifier');
var concat = require('gulp-concat');
var assign = require('lodash.assign');

var watchify = require('gulp-watchify');
var coffeeify = require('coffeeify');
var envify = require('envify');

var paths = {
  chrome: ['./chrome/main.coffee'],
  metal: ['./main.coffee', './metal/**/*.coffee'],
  scss: ['./style/**/*.scss']
};

/**
 * Compile and bundle chrome code with watchify
 */

// Hack to enable configurable watchify watching
var watching = false;
gulp.task('enable-watch-mode', function() {
  watching = true;
});

gulp.task('chrome', watchify(function (watchify) {
  return gulp.src(paths.chrome)
    .pipe(plumberNotifier())
    .pipe(watchify({
      watch: watching,
      extensions: ['.coffee', '.js'],
      setup: function (bundle) {
        bundle.transform(coffeeify);
        bundle.transform(envify);
      }
    }))
    .pipe(streamify(concat('bundle.js')))
    .pipe(gulp.dest('./chrome/'));
}));

/*
 * Compile metal code in-place with coffee-script
 */

gulp.task('metal', function() {
  return gulp.src(paths.metal, { base: './' })
    .pipe(plumberNotifier())
    .pipe(coffee().on('error', gutil.log))
    .pipe(gulp.dest('.'));
});

/*
 * Compile css with sass
 */

gulp.task('scss', function() {
  return gulp.src('style/main.scss')
    .pipe(plumberNotifier())
    .pipe(sass())
    .pipe(gulp.dest('style'));
});

/*
 * Watch all code changes and recompile on-demand
 */

gulp.task('watch', ['enable-watch-mode'], function () {
  gulp.watch(paths.metal, ['metal']);
  gulp.watch(paths.scss, ['scss']);
  gulp.start('chrome');
});

gulp.task('all', ['metal', 'chrome', 'scss']);

gulp.task('default', ['all']);

