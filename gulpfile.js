'use strict';
    
var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
	plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    concat = require('gulp-concat'),
    rimraf = require('rimraf'),
    cache = require('gulp-cache'),
    ftp = require('vinyl-ftp'),    
    watch = require('gulp-watch'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload;
    
var pug = require('gulp-pug'),
    htmlmin = require('gulp-htmlmin');

var sass = require('gulp-sass'),
    uncss = require('gulp-uncss'),
    autoprefixer = require('gulp-autoprefixer'),    
    combineMq = require('gulp-combine-mq'),
	cleanCSS = require('gulp-clean-css');    

var uglify = require('gulp-uglify');

var imagemin = require('gulp-imagemin');


// ======== PATH ========  

    var path = {
            build: {
                html: './build',
                js: './build/js',
                style: './build/css/style.css',
                img: './build/img',
                fonts: './build/fonts'
            },
            src: { 
                html: ['./src/**/*.+(pug|html)', '!./**/_*.*'], 
                js: ['./src/**/*.js', '!./**/_*.*'],
                style: ['./src/**/*.scss', '!./**/_*.*'],
                img: './src/img/**/*.*', 
                fonts: './src/fonts/**/*.*',
                libs: ['./src/libs/**/*.js', '!./**/_*.*']
            },
            watch: { 
                html: './src/**/*.+(pug|html)', 
                js: ['./src/**/*.js', '!./src/libs/**/*.js'],
                style: './src/**/*.scss',
                img: './src/img/**/*.*', 
                fonts: './src/fonts/*.*',
                libs: './src/libs/**/*.*'
            }
        };


// ======== DEVELOPER ======== 

    //HTML
    gulp.task('dev:html', function() {
	return gulp.src(path.src.html)
		.pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(sourcemaps.init())
        .pipe(pug({pretty: true}))
        .pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({stream: true}));
    });

    //CSS
    gulp.task('dev:style', function(){
    return gulp.src(path.src.style)
        .pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer({
			browsers: ['last 10 versions'],
			cascade: false
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.style))
        .pipe(reload({stream: true}));
    });

    //JS
    gulp.task('dev:js', function(){
    return gulp.src(path.src.js)
        .pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
    });


// ======== BUILD ======== 
  
    //HTML
    gulp.task('build:html', function() {
	return gulp.src(path.src.html)
		.pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(pug({pretty: false}))
        .pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({stream: true}));
    });

    //CSS
    gulp.task('build:style', function(){
    return gulp.src(path.src.style)
        .pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(sass())
        // .pipe(uncss({html: path.build.html + '/**/*.html'}))
        .pipe(autoprefixer({
			browsers: ['last 10 versions'],
			cascade: false
        }))
        .pipe(combineMq({beautify: false}))
        .pipe(cleanCSS())
        .pipe(gulp.dest(path.build.style))
        .pipe(reload({stream: true}));
    });

    //JS
    gulp.task('build:js', function(){
    return gulp.src(path.src.js)
        .pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
    });

    //IMAGE
    gulp.task('build:img', function(){
    return gulp.src(path.src.img)
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            optimizationLevel: 3,
            svgoPlugins: [{removeViewBox: false}]
        })))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
    });

    //FONTS
    gulp.task('build:fonts', function(){
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
    });

    //LIBS
    gulp.task('build:libs', function(){
    return gulp.src(path.src.libs)
        .pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
    });


// ======== WATCHER ========

    gulp.task('watcher', function(){
        watch(path.watch.html, function () {
            gulp.start('dev:html');
        });
        watch(path.watch.style, function () {
            gulp.start('dev:style');
        });        
        watch(path.watch.js, function () {
            gulp.start('dev:js');
        });
        watch(path.watch.img, function () {
            gulp.start('build:img');
        });
        watch(path.watch.fonts, function () {
            gulp.start('build:fonts');
        });
        watch(path.watch.libs, function () {
            gulp.start('build:libs');
        });     
    });


// ======== DEPLOY ========

    gulp.task('ftp', function() {
        var conn = ftp.create({
            host:     '',
            user:     '',
            password: '',
            parallel: 5
        });

        var globs = 'build/**/*.*';

        return gulp.src( globs, { base: '.', buffer: false } )
            .pipe( conn.dest( '/path/to/folder/on/server' ) )
            .pipe(notify("Dev site updated!"));

    });

    gulp.task('deploy', [
        'build',
        'ftp'
    ]);


// ======== browserSync ======== 

gulp.task('webserver', function () {
    browserSync.init({
        server: './build',
        notify: false
    });
});

// ======== CLEAN / BUILD ========

    gulp.task('clean', function(cb){
        rimraf('./build', cb);
    });

    gulp.task('build', [
        'clean',
        'build:html',
        'build:style',
        'build:js',
        'build:img',
        'build:fonts',
        'build:libs'
    ]);

    gulp.task('build:dev', [
        'dev:html',
        'dev:style',
        'dev:js'
    ]);

    gulp.task('clearcache', function () { return cache.clearAll(); });
    gulp.task('getWatch', ['webserver', 'watcher']);