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

Vue.prototype.$preventDoubleClick = (target, processFn) => {
  const dataLockedAt = target.attr('data-locked-at')
  if (!dataLockedAt || +(new Date() - dataLockedAt) > 2000) {
    processFn()
  }
  target.attr('data-locked-at', +new Date())
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