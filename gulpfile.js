
var gulp = require('gulp')
var sass = require('gulp-sass')
var babel = require('gulp-babel')
var plumber = require('gulp-plumber')
var sourcemaps = require('gulp-sourcemaps')

var paths = {
  es6: ['./chrome/**/*.es6', './main.es6', './metal/**/*.es6'],
  scss: ['./style/**/*.scss']
}

/*
 * Compile ES6 code in-place with babel
 */

gulp.task('es6', function () {
  return gulp.src(paths.es6, {
    base: './'
  }).pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./'))
})

/*
 * Compile SCSS code with sassc
 */

gulp.task('scss', function () {
  return gulp.src('./style/main.scss')
  .pipe(plumber())
  .pipe(sass().on('error', sass.logError))
  .pipe(gulp.dest('./style'))
})

/*
 * Watch all code changes and recompile on-demand
 */

gulp.task('watch', ['all'], function () {
  gulp.watch(paths.es6, ['es6'])
  gulp.watch(paths.scss, ['scss'])
})

gulp.task('all', ['es6', 'scss'])

gulp.task('default', ['all'])
