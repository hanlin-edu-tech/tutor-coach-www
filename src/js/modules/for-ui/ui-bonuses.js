import dataBonuses from './data-bonuses'
import singleBonus from '../components/single-bonus'

export default {
  name: 'bonuses',
  el: '#bonuses',
  data () {
    return {
      bonuses: dataBonuses
    }
  },
  components: {
    'bonus': singleBonus
  }
}