
var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var plumber = require('gulp-plumber');
var plumberNotifier = require('gulp-plumber-notifier');
var source = require('vinyl-source-stream');
var assign = require('lodash.assign');

var watchify = require('watchify');
var browserify = require('browserify');
var coffeeify = require('coffeeify');
var envify = require('envify');

var paths = {
  metal: ['./main.coffee', './metal/**/*.coffee'],
  chrome: ['./chrome/**/*.coffee'],
  scss: ['./style/**/*.scss']
};

/**
 * Compile and bundle chrome code with watchify
 */

(function() {
  var customOpts = {
    entries: ['./chrome/main.coffee'],
    extensions: ['.coffee', '.js']
  };
  var opts = assign({}, watchify.args, customOpts);
  var b = watchify(browserify(opts));
  b.transform(coffeeify);
  b.transform(envify);
  b.on('log', gutil.log); // output build logs to terminal

  gulp.task('chrome', function () {
    var handler = plumberNotifier().errorHandler;
    return b.bundle()
      .on('error', function(message) {
        handler.call(this, {plugin: 'browserify', message: message});
        this.emit('end');
      })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('./chrome/'));
  });
})();

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

gulp.task('watch', function () {
  gulp.watch(paths.metal, ['metal']);
  gulp.watch(paths.chrome, ['chrome']);
  gulp.watch(paths.scss, ['scss']);
});

gulp.task('default', ['watch']);

