
var gulp = require('gulp');
var coffee = require('gulp-coffee');
var plumber = require('gulp-plumber');
var transform = require('vinyl-transform');

var browserify = require('browserify');

var paths = {
  chrome: ['./chrome/**/*.coffee'],
  metal: ['./main.coffee', './metal/**/*.coffee']
};

gulp.task('chrome', function() {
  var browserified = transform(function (filename) {
    var b = browserify(filename, {
      extensions: ['.coffee', '.js']
    });
    return b.bundle();
  });

  return gulp.src(paths.chrome)
    .pipe(plumber())
    .pipe(browserified)
    .pipe(gulp.dest('./chrome/'));
}); 

gulp.task('metal', function() {
  return gulp.src(paths.chrome)
    .pipe(coffee())
    .pipe(gulp.dest('./'));
}); 

gulp.task('watch', function () {
  gulp.watch(paths.chrome, ['chrome']);
  gulp.watch(paths.metal, ['metal']);
});

gulp.task('default', ['watch']);

