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
const appPath = 'app/coach/'

const distDir = path.join(__dirname, 'dist/')

const cleanGCS = async (bucketName, storage) => {
  const options = {
    prefix: appPath,
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

const uploadToGCS = async (bucketName, projectId, gcsKeyPath, cacheControlConfig) => {
  let storage = new Storage({
    projectId: projectId,
    keyFilename: gcsKeyPath
  })

  // await cleanGCS(bucketName, storage)

  const multiDistEntireFilePath = await findAllUploadFilesPath(distDir)
  multiDistEntireFilePath.forEach(distEntireFilePath => {
    storage.bucket(bucketName)
      .upload(distEntireFilePath,
        {
          destination: `${appPath}${distEntireFilePath.replace(distDir, '')}`,
          metadata: {
            cacheControl: cacheControlConfig,
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

const switchUiJsMode = mode => {
  return gulp
    .src(['./src/js/modules/main.js'], {
      base: './'
    })
    .pipe(
      replace(/(from '(.\/for-ui\/ui-courses|.\/courses)')/g, () => {
        if (mode === 'ui') {
          return 'from \'./for-ui/ui-courses\''
        } else {
          return 'from \'./courses\''
        }
      })
    )
    .pipe(
      replace(/(from '(.\/for-ui\/ui-bonuses|.\/bonuses)')/g, () => {
        if (mode === 'ui') {
          return 'from \'./for-ui/ui-bonuses\''
        } else {
          return 'from \'./bonuses\''
        }
      })
    )
    .pipe(gulp.dest('./'))
}

const switchEnv = env => {
  return gulp
    .src(['./src/js/modules/firestore/firebase-auth.js'], {
      base: './'
    })
    .pipe(
      replace(/(export default (productionConfig|testConfig))/g, () => {
        if (env === 'test') {
          return 'export default testConfig'
        } else {
          return 'export default productionConfig'
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

/* 依據開發方式佈署 */
gulp.task('switchUi', switchUiJsMode.bind(switchUiJsMode, 'ui'))
gulp.task('switchJs', switchUiJsMode.bind(switchUiJsMode, 'js'))

gulp.task('switchProductionEnv', switchEnv.bind(switchEnv, 'production'))
gulp.task('switchTestEnv', switchEnv.bind(switchEnv, 'test'))

gulp.task('packageToUi', gulp.series(clean.bind(clean, './dist'), 'copyToDist',
  gulp.parallel('compilePugSass', 'minifyImage', 'switchUi')))

gulp.task('packageToJs',
  gulp.series(
    clean.bind(clean, './dist'),
    'copyToDist',
    gulp.parallel('compilePugSass', 'minifyImage', 'switchJs', 'switchTestEnv'),
    'copyToDist'
  )
)

gulp.task('packageToProduction',
  gulp.series(
    clean.bind(clean, './dist'),
    'copyToDist',
    gulp.parallel('compilePugSass', 'minifyImage', 'switchJs', 'switchProductionEnv'),
    'copyToDist'
  )
)

gulp.task('watch', gulp.series('copyToDist', gulp.parallel(watchPugSassImages)))

/* 上傳 GCS */
gulp.task('uploadGcsTest', uploadToGCS.bind(uploadToGCS, 'tutor-test-apps/', 'tutor-test-238709', './tutor-test.json', 'no-store'))
gulp.task('uploadGcsProd', uploadToGCS.bind(uploadToGCS, 'tutor-apps/', 'tutor-204108', './tutor.json', 'public, max-age=10800'))