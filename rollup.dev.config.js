import rollupBaseConfig from './rollup.base.config'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

rollupBaseConfig.plugins.push(serve({
  open: true,  // 是否打开浏览器 (default: false)
  contentBase: './dist', // 入口HTML 文件位置
  host: 'localhost',
  port: 30001,
}))

rollupBaseConfig.plugins.push(livereload({
  watch: 'dist',
  verbose: false
}))

export default rollupBaseConfig