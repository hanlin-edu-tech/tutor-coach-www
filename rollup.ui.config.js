import rollupBaseConfig from './rollup.base.config'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

rollupBaseConfig.plugins.push(serve({
  open: true,
  contentBase: './dist',
  host: 'localhost',
  port: 30000
}))

rollupBaseConfig.plugins.push(livereload({
  watch: 'dist',
  verbose: false
}))

export default rollupBaseConfig