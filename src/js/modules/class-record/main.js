import histories from './histories'
import util from '../util/util'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

util.registerArrayLast()
util.registerArrayFirst()
util.groupBy()

dayjs.locale('zh-tw')
Vue.prototype.$dayjs = dayjs
Vue.prototype.$delay = millisecond => {
  return new Promise(
    resolve => {
      setTimeout(resolve, millisecond)
    }
  )
}

new Vue({
  render: createElement => {
    return createElement(histories)
  }
}).$mount('#histories')