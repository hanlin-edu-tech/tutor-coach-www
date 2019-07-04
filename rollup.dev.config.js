import rollupBaseConfig from './rollup.base.config'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

rollupBaseConfig[0].plugins.push(serve({
  open: true,
  contentBase: './dist',
  host: 'localhost',
  port: 30001
}))

rollupBaseConfig[0].plugins.push(livereload({
  watch: 'dist',
  verbose: false
}))

export default rollupBaseConfig