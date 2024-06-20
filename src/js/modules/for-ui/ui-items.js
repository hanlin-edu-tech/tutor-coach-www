import dataItems from './data-items'
import uiSingeItem from './ui-single-item'

export default {
  name: 'items',
  el: '#items',
  data () {
    return {
      items: dataItems
    }
  },
  components: {
    'item': uiSingeItem
  },

}
