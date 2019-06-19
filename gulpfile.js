const del = require('del')
const pug = require('pug')
const gulp = require('gulp')
const es = require('event-stream')
const rename = require('gulp-rename')
const gulpSass = require('gulp-sass')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')
const replace = require('gulp-replace')
const browserSync = require('browser-sync')
const cache = require('gulp-cache')
const imageMin = require('gulp-imagemin')
const pngquant = require('imagemin-pngquant')
const { Storage } = require('@google-cloud/storage')
const fs = require('fs').promises
const path = require('path')

const distDir = path.join(__dirname, 'dist/')
const storage = new Storage({
  projectId: 'tutor-204108',
  keyFilename: './tutor.json'
})

const cleanGCS = async bucketName => {
  const options = {
    prefix: 'app/coach/',
  }

  const [files] = await storage.bucket(bucketName).getFiles(options)
  for (let file of files) {
    await storage.bucket(bucketName)
      .file(file.name)
      .delete()
    console.log(`${file.name} is deleted`)
  }
}

const findAllUploadFilesPath = async (dir, multiDistEntireFilePath = []) => {
  const files = await fs.readdir(dir)

  for (let file of files) {
    const entireFilepath = path.join(dir, file)
    const fileStatus = await fs.stat(entireFilepath)

    if (fileStatus.isDirectory()) {
      multiDistEntireFilePath = await findAllUploadFilesPath(entireFilepath, multiDistEntireFilePath)
    } else {
      multiDistEntireFilePath.push(entireFilepath)
    }
  }

  return multiDistEntireFilePath
}

const uploadToGCS = async bucketName => {
  await cleanGCS(bucketName)

  const multiDistEntireFilePath = await findAllUploadFilesPath(distDir)
  multiDistEntireFilePath.forEach(distEntireFilePath => {
    storage.bucket(bucketName)
      .upload(distEntireFilePath,
        {
          destination: `/app/coach/${distEntireFilePath.replace(distDir, '')}`,
          metadata: {
            cacheControl: 'no-store',
          },
          public: true
        },
        (err, file) => {
          console.log(`Upload ${file.name} successfully`)
        }
      )
  })
}

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
      .pipe(browserSync.reload({
        stream: true
      }))
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
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  })

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

/* 上傳 GCS */
gulp.task('uploadToGcsTest', uploadToGCS.bind(uploadToGCS, 'tutor-apps-test/'))
gulp.task('uploadToGcsProduction', uploadToGCS.bind(uploadToGCS, 'tutor-apps/'))