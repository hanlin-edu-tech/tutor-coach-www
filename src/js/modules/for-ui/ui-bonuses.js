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
  },
  mounted () {
    const isAllStampNotFinished = dataBonuses.some(simpleBonus => simpleBonus.isStampFinish === false)

    if (isAllStampNotFinished === true) {
      $('#bonus-received .btn-get').css({ display: 'none' })
      $('#bonus-received .btn-none').css({ display: '' })
    } else {
      $('#bonus-received .btn-get').css({ display: '' })
      $('#bonus-received .btn-none').css({ display: 'none' })
    }
  }}