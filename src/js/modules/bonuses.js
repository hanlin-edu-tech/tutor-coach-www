import { db, fireStoreAuth } from './firestore/firebase-config'
import singleBonus from './components/single-bonus'

export default {
  name: 'bonuses',
  el: '#bonuses',
  data () {
    return {
      bonuses: [],
      ehanlinUser: window.ehanlinUser,
      LIMITED_COMBO_BONUS: 5,
      currentComboBonus: 0,
      bonusUnReceived: 0
    }
  },
  components: {
    'bonus': singleBonus
  },

  async mounted () {
    const vueModel = this
    await fireStoreAuth()

    vueModel.onReceivedBonus()
    vueModel.listeningOnUserAchievementChange()
  },

  methods: {
    onReceivedBonus () {
      const vueModel = this
      $('#bonus-received').on('click', () => {
        $.ajax({
          type: 'PUT',
          url: 'http://labs.ehanlin.com.tw/coach-web/UserAchievement/received',
          success: function (response) {
            alert(response)
            vueModel.bonusUnReceived--
            vueModel.determineShowReceivedBonusBtn(vueModel.bonusUnReceived)
          }
        })
      })
    },

    determineShowReceivedBonusBtn (bonusUnReceived) {
      if (bonusUnReceived > 0) {
        $('#bonus-received .btn-get').css({ display: '' })
        $('#bonus-received .btn-none').css({ display: 'none' })
      } else {
        $('#bonus-received .btn-get').css({ display: 'none' })
        $('#bonus-received .btn-none').css({ display: '' })
      }
    },

    composeBonusInfo (userAchievement) {
      const vueModel = this
      const comboBonus = userAchievement.continuous % vueModel.LIMITED_COMBO_BONUS
      vueModel.currentComboBonus = comboBonus
      vueModel.bonusUnReceived = userAchievement.bonus

      for (let i = 1; i <= vueModel.LIMITED_COMBO_BONUS; i++) {
        const bonusInfo = {}
        const isBonusLabel = ((i <= comboBonus) || (comboBonus === 0 && vueModel.bonusUnReceived > 0))
        if (isBonusLabel) {
          bonusInfo.isStampFinish = true
          bonusInfo.isStampNone = false
          bonusInfo.isAnimationStamp = true
        } else {
          bonusInfo.isStampFinish = false
          bonusInfo.isStampNone = true
          bonusInfo.isAnimationStamp = false
        }
        vueModel.bonuses.push(bonusInfo)
      }
    },

    listeningOnUserAchievementChange () {
      const vueModel = this
      db.collection('UserAchievement')
        .where('user', '==', vueModel.ehanlinUser)
        .onSnapshot(
          async userAchievementQuerySnapshot => {
            const userAchievementNewestChange = userAchievementQuerySnapshot.docChanges().last()
            const userAchievement = userAchievementNewestChange.doc.data()

            switch (userAchievementNewestChange.type) {
              case 'added': {
                vueModel.composeBonusInfo(userAchievement)
                vueModel.determineShowReceivedBonusBtn(userAchievement.bonus)
                break
              }

              case 'modified': {
                let comboBonus = userAchievement.continuous % vueModel.LIMITED_COMBO_BONUS
                if (comboBonus !== vueModel.currentComboBonus) {
                  vueModel.currentComboBonus = comboBonus
                  if(comboBonus === 0 && userAchievement.bonus > 0) {
                    comboBonus = 5
                  }

                  for (let index = 0; index < comboBonus; index++) {
                    Vue.set(vueModel.bonuses, index, {
                        isStampFinish: true,
                        isStampNone: false,
                        isAnimationStamp: true
                      }
                    )
                  }

                  for (let index = comboBonus; index < vueModel.LIMITED_COMBO_BONUS; index++) {
                    Vue.set(vueModel.bonuses, index, {
                        isStampFinish: false,
                        isStampNone: true,
                        isAnimationStamp: false
                      }
                    )
                  }

                }

                vueModel.determineShowReceivedBonusBtn(userAchievement.bonus)
                break
              }
            }
          }
        )
    },
  }
}