/**
 * Created by wensheng.yan on 8/19/16.
 */
'use strict';

var babelify    = require('babelify');
var browserify  = require('browserify');
var versionify = require('browserify-versionify');
var del         = require('del');
var gulp        = require('gulp');
var sass        = require('gulp-sass');
var cssnano     = require('gulp-cssnano');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var runSequence = require('run-sequence');
var path        = require('path');
var mergeStream = require('merge-stream');
var buffer      = require('vinyl-buffer');
var source      = require('vinyl-source-stream');
var lazypipe = require('lazypipe');
var browserSync = require('browser-sync').create();

var config = {
    distPath: './dist'
};

gulp.task('build', function (done) {
    runSequence(
        'clean',
        'build-script',
        'build-styles',
        function (error) {
            if(error){
                console.log(error.message);
            }
            done(error);
        }
    )
});

gulp.task('clean', function (done) {
    del.sync(['dist'], {force: true});
    done();
});

function buildProdJs(destPath) {
    var process = lazypipe()
        .pipe(buffer)
        .pipe(uglify)
        .pipe(rename, {suffix: '.min'})
        .pipe(gulp.dest, destPath);
    return process();
}

function buildProdCss(destPath) {
    var process = lazypipe()
        .pipe(buffer)
        .pipe(cssnano)
        .pipe(rename, {suffix: '.min'})
        .pipe(gulp.dest, destPath);
    return process();
}

gulp.task('build-script', function () {
    var filename = "plugin.js";
    var destPath = config.distPath;
    browserify({
        entries: path.join('src/scripts', filename),
        debug: true
    })
        .transform(versionify, {
            placeholder: '__VERSION__'
        })
        .transform(babelify, {
            presets: ['es2015'],
            sourceMaps: true
        })
        .bundle()
        .pipe(source(filename))
        .pipe(rename('360-panorama.js'))
        .pipe(gulp.dest(destPath))
        .pipe(buildProdJs(destPath));
});

gulp.task('build-styles', function () {
    var fileName  = 'plugin.scss';
    var entryFile = path.join('src/styles', fileName);
    var destPath = config.distPath;

    return gulp.src(entryFile)
        .pipe(sass())
        .pipe(rename('videojs-panorama.css'))
        .pipe(gulp.dest(destPath))
        .pipe(buildProdCss(destPath));
});

gulp.task('browser-sync', ['build'], function() {
    browserSync.init({
        server: {
            baseDir: "./"
        },
        open: 'ui'
    });
});

gulp.task('watch', ['browser-sync'], function () {
    gulp.watch('src/scripts/**/*.js', ['build-script']);
    gulp.watch('src/styles/**/*.scss', ['build-styles']);
});

gulp.task('default', ['watch']);