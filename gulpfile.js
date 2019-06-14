const del = require('del')
const fs = require('fs').promises
const pug = require('pug')
const gulp = require('gulp')
const es = require('event-stream')
const rename = require('gulp-rename')
const gulpSass = require('gulp-sass')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')
const replace = require('gulp-replace')
const cache = require('gulp-cache')
const imageMin = require('gulp-imagemin')
const pngquant = require('imagemin-pngquant')

let bucketNameForTest = 'tutor-apps-test'
let bucketNameForProd = 'tutor-apps'
let projectId = 'tutor-204108'
let keyFilename = 'tutor.json'
let projectName = 'app/coach/'

const clean = source => {
  return del([source])
}

const buildHtml = () => {
  return es.map((file, cb) => {
    file.contents = Buffer.from(
      pug.renderFile(
        file.path, {
          filename: file.path,
          pretty: true
        }
      )
    )
    cb(null, file)
  })
}

const htmlTask = dest => {
  return () => {
    return gulp.src('src/pug/**/*.pug')
      .pipe(buildHtml())
      .pipe(rename({
        extname: '.html'
      }))
      .pipe(gulp.dest(dest))
  }
}

const styleTask = dest => {
  return () => {
    const processors = [
      autoprefixer({ grid: true })
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

const copyStaticTask = dest => {
  return () => {
    return gulp.src(['src/css/**', 'src/js/*.js'], {
      base: 'src'
    })
      .pipe(gulp.dest(dest))
  }
}

const switchEnv = env => {
  return gulp
    .src(['./src/js/modules/main.js'], {
      base: './'
    })
    .pipe(
      replace(/(from '(.\/for-ui\/ui-courses|.\/courses)')/g, () => {
        if (env === 'ui') {
          return 'from \'./for-ui/ui-courses\''
        } else {
          return 'from \'./courses\''
        }
      })
    )
    .pipe(
      replace(/(from '(.\/for-ui\/ui-bonuses|.\/bonuses)')/g, () => {
        if (env === 'ui') {
          return 'from \'./for-ui/ui-bonuses\''
        } else {
          return 'from \'./bonuses\''
        }
      })
    )
    .pipe(gulp.dest('./'))
}

const minifyImage = sourceImage => {
  return gulp
    .src(sourceImage, { base: './src' })
    .pipe(cache(imageMin({
      use: [pngquant({
        speed: 7
      })]
    })))
    .pipe(gulp.dest('./dist'))
}

const watchPugSassImages = () => {
  gulp.watch('src/pug/**/*.pug', gulp.series('html'))
  gulp.watch('src/sass/**/*.sass', gulp.series(['style', 'copyToDist']))
  gulp.watch('./src/img/**/*.@(jpg|png)', gulp.series('minifyImage'))
}

gulp.task('html', htmlTask('./dist'))
gulp.task('copyToDist', copyStaticTask('./dist'))
gulp.task('style', styleTask('./dist/css'))
gulp.task('minifyImage', minifyImage.bind(minifyImage, './src/img/**/*.@(jpg|png)'))
gulp.task('compilePugSass', gulp.series(['style', 'html']))

/* 依據環境佈署 */
gulp.task('switchUiEnv', switchEnv.bind(switchEnv, 'ui'))
gulp.task('switchDevEnv', switchEnv.bind(switchEnv, 'dev'))

gulp.task('packageToUi', gulp.series(clean.bind(clean, './dist'), 'copyToDist',
  gulp.parallel('compilePugSass', 'minifyImage', 'switchUiEnv')))

gulp.task('packageToDev', gulp.series(clean.bind(clean, './dist'), 'copyToDist',
  gulp.parallel('compilePugSass', 'minifyImage', 'switchDevEnv')))

gulp.task('watch', gulp.series('copyToDist', gulp.parallel(watchPugSassImages)))
