import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: './src/js/modules/main.js',
  output: {
    file: './dist/js/bundle.min.js',
    format: 'iife'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true
    }),
    resolve(),
    commonjs()
  ]
}