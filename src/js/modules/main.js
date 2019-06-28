import courses from './for-ui/ui-courses'
import bonuses from './for-ui/ui-bonuses'
import util from './util/util'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

util.registerArrayLast()
util.registerArrayFirst()

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
    return createElement(courses)
  }
}).$mount('#courses')

new Vue({
  render: createElement => {
    return createElement(bonuses)
  }
}).$mount('#bonuses')