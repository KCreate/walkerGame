var gulp =          require('gulp');
var sass =          require('gulp-sass');
var autoprefixer =  require('gulp-autoprefixer');
var minify =        require('gulp-minify-css');
var concat =        require('gulp-concat');

gulp.task('default', ['sass', 'sass:watch', 'scripts', 'scripts:watch'], function() {});

/*
    Scripts
*/
gulp.task('scripts', function() {
    return gulp.src([
            './client/res/textures.json',
            './client/lib/helper.js',
            './client/lib/render.js',
            './client/lib/views.js',
            './client/lib/controller.js'
        ])
        .pipe(concat('./client/app.js'))
        .pipe(gulp.dest('./'));
});

gulp.task('scripts:watch', function () {
    return gulp.watch([
            './client/res/textures.json',
            './client/lib/helper.js',
            './client/lib/render.js',
            './client/lib/views.js',
            './client/lib/controller.js'
        ], ['scripts']);
});

/*
    Styles
*/
gulp.task('sass', function() {
    return gulp.src('./client/res/scss/*.scss')
        .pipe(sass().on('error', console.log))
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(minify({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest('./client/res/css'));
});

gulp.task('sass:watch', function () {
    return gulp.watch('./client/res/scss/*.scss', ['sass']);
});
