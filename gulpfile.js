const Q = require('q')
const fs = require('fs')
const pug = require('pug')
const gulp = require('gulp')
const es = require('event-stream')
const rename = require('gulp-rename')
const gulpSass = require('gulp-sass')
const gcPub = require('gulp-gcloud-publish')
const util = require('gulp-template-util')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')

let bucketNameForTest = 'tutor-apps-test'
let bucketNameForProd = 'tutor-apps'
let projectId = 'tutor-204108'
let keyFilename = 'tutor.json'
let projectName = 'app/coach/'

function buildHtml () {
  return es.map(function (file, cb) {
    file.contents = new Buffer(pug.renderFile(
      file.path, {
        filename: file.path,
        pretty: true
      }
    ))
    cb(null, file)
  })
}

function htmlTask (dest) {
  return function () {
    return gulp.src('src/pug/**/*.pug')
      .pipe(buildHtml())
      .pipe(rename({
        extname: '.html'
      }))
      .pipe(gulp.dest(dest))
  }
}

function libTask (dest) {
  return function () {
    var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8').toString())
    if (!packageJson.dependencies) {
      packageJson.dependencies = {}
    }
    var webLibModules = []
    for (var module in packageJson.dependencies) {
      webLibModules.push('node_modules/' + module + '/**/*')
    }
    return gulp.src(webLibModules, {
      base: 'node_modules/'
    })
      .pipe(gulp.dest(dest))
  }
}

function styleTask (dest) {
  return function () {
    var processors = [
      autoprefixer({ grid: true, browsers: ['last 2 version', 'ie 11', '>1%']})
    ]
    return gulp.src('src/sass/**/*.sass')
      .pipe(gulpSass())
      .pipe(postcss(processors))
      .pipe(rename({
        extname: '.css'
      }))
      .pipe(gulp.dest(dest))
  }
}

function copyStaticTask (dest) {
  return function () {
    return gulp.src(['src/*.html', 'src/img/**', 'src/css/**', 'src/js/**'], {
      base: 'src'
    })
      .pipe(gulp.dest(dest))
  }
}

let uploadGCS = bucketName => {
  return gulp
    .src([
      './dist/*.html',
      './dist/css/**/*.@(css|eot|svg|ttf|woff)',
      './dist/js/**/*.js',
      './dist/img/**/*.@(jpg|png|gif|svg|mp4)'
    ], {
      base: `${__dirname}/dist/`
    })
    .pipe(gcPub({
      bucket: bucketName,
      keyFilename: keyFilename,
      base: projectName,
      projectId: projectId,
      public: true,
      metadata: {
        cacheControl: 'private, no-transform'
      }
    }))
}

gulp.task('uploadGcpTest', uploadGCS.bind(uploadGCS, bucketNameForTest))
gulp.task('uploadGcpProd', uploadGCS.bind(uploadGCS, bucketNameForProd))
gulp.task('lib', libTask('src/lib'))
gulp.task('style', styleTask('src/css'))
gulp.task('html', htmlTask('src'))
gulp.task('build', ['style', 'html'])
gulp.task('default', ['build'])
gulp.task('watch', function () {
  gulp.watch('src/pug/**/*.pug', ['html'])
  gulp.watch('src/sass/**/*.sass', ['style'])
})

gulp.task('package', function () {
  let deferred = Q.defer()
  Q.fcall(function () {}).then(function () {
    return Q.all([
      util.logStream(copyStaticTask('dist')),
      util.logStream(styleTask('dist/css')),
      util.logStream(htmlTask('dist'))
    ])
  })

  return deferred.promise
})
