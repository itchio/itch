
var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var streamify = require('gulp-streamify');
var concat = require('gulp-concat');
var watchify = require('gulp-watchify');
var sourcemaps = require('gulp-sourcemaps');
var coffeeify = require('coffeeify');
var babelify = require('babelify');
var envify = require('envify');

var paths = {
  chrome: ['./app/chrome/main.es6'],
  metal: ['./app/metal/**/*.coffee'],
  metal6: ['./app/main.es6', './app/metal/**/*.es6'],
  scss: ['./app/style/**/*.scss']
};

/*
 * Compile and bundle chrome code with watchify
 */

var watching = false;

gulp.task('enable-watch-mode', function() {
  watching = true;
});

gulp.task('chrome', watchify(function(watchify) {
  return gulp.src(paths.chrome).pipe(plumber()).pipe(watchify({
    watch: watching,
    extensions: ['.coffee', '.js', '.es6'],
    debug: true,
    setup: function(bundle) {
      bundle.transform(coffeeify);
      bundle.transform(babelify);
      return bundle.transform(envify);
    }
  }))
  .pipe(streamify(sourcemaps.init({loadMaps: true})))
  .pipe(streamify(concat('bundle.js')))
  .pipe(streamify(sourcemaps.write('./maps')))
  .pipe(gulp.dest('./app/chrome/'));
}));


/*
 * Compile metal code in-place with coffee-script
 */

gulp.task('metal', function() {
  return gulp.src(paths.metal, {
    base: './app/'
  }).pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(coffee().on('error', function(e) {
    return gutil.log("Coffeescript error: \n\n" + e.filename + ":" + e.location.first_line + ":" + e.location.first_column + "\n" + e.message);
  })).pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./app/'));
});

gulp.task('metal6', function() {
  return gulp.src(paths.metal6, {
    base: './app/'
  }).pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./app/'));
});


/*
 * Compile css with sass
 */

gulp.task('scss', function() {
  return gulp.src('./app/style/main.scss')
  .pipe(plumber())
  .pipe(sass().on('error', sass.logError))
  .pipe(gulp.dest('./app/style'));
});


/*
 * Watch all code changes and recompile on-demand
 */

gulp.task('watch', ['enable-watch-mode'], function() {
  gulp.watch(paths.metal, ['metal']);
  gulp.watch(paths.metal6, ['metal6']);
  gulp.watch(paths.scss, ['scss']);
  return gulp.start('chrome');
});

gulp.task('all', ['metal', 'metal6', 'chrome', 'scss']);

gulp.task('default', ['all']);

