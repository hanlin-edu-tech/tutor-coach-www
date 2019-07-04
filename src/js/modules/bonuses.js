import { db, ehanlinAuth } from './firestore/firebase-config'
import singleBonus from './components/single-bonus'
import showModal from './util/show-modal'
import { PopupText } from './util/modal-text'

export default {
  name: 'bonuses',
  el: '#bonuses',
  data () {
    return {
      bonuses: [],
      ehanlinUser: '',
      LIMITED_SHOW_COMBO_BONUS: 5,
      currentComboBonus: 0,
      bonusUnReceived: 0
    }
  },
  components: {
    'bonus': singleBonus
  },

  async mounted () {
    const vueModel = this
    vueModel.ehanlinUser = await ehanlinAuth()
    vueModel.onReceivedBonus()
    vueModel.listeningOnUserAchievementChange()
  },

  methods: {
    onReceivedBonus () {
      const vueModel = this
      $('#bonus-received .btn-get').on('click', async () => {
        try {
          let coins = 0, gems = 0
          const receivedReward = await $.ajax({
            type: 'PUT',
            url: '/coach-web/UserAchievement/received',
          })
          receivedReward.forEach(
            reward => {
              coins = reward.type === 'coin' ? reward.amount : 0
              gems = reward.type === 'gem' ? reward.amount : 0
            }
          )
          showModal(PopupText.reward(coins, gems))

          vueModel.bonusUnReceived--
          vueModel.determineShowReceivedBonusBtn(vueModel.bonusUnReceived)
        } catch (error) {
          console.error(error)
          showModal(PopupText.REWARD_ERROR)
        }
      })
    },

    determineShowReceivedBonusBtn (bonusUnReceived) {
      $('#bonus-received .gift-get-number').text(bonusUnReceived)
      if (bonusUnReceived > 0) {
        $('#bonus-received .text-get-number').css({ display: '' })
        $('#bonus-received .btn-get').css({ display: '' })
        $('#bonus-received .btn-none').css({ display: 'none' })
      } else {
        $('#bonus-received .text-get-number').css({ display: 'none' })
        $('#bonus-received .btn-get').css({ display: 'none' })
        $('#bonus-received .btn-none').css({ display: '' })
      }
    },

    composeBonusInfo (userAchievement) {
      const vueModel = this
      const comboBonus = userAchievement.continuous % vueModel.LIMITED_SHOW_COMBO_BONUS
      vueModel.currentComboBonus = comboBonus
      vueModel.bonusUnReceived = userAchievement.bonus

      // initial bonuses
      vueModel.bonuses = []
      for (let i = 1; i <= vueModel.LIMITED_SHOW_COMBO_BONUS; i++) {
        const bonusInfo = {}
        const isBonusLabel = ((i < comboBonus) || (comboBonus === 0 && vueModel.bonusUnReceived > 0))

        /* 獲得最新 bonus 徽章加入動畫 */
        if (comboBonus !== 0 && i === comboBonus) {
          bonusInfo.isStampFinish = true
          bonusInfo.isStampNone = false
          bonusInfo.isAnimationStamp = true
        } else if (isBonusLabel) {
          bonusInfo.isStampFinish = true
          bonusInfo.isStampNone = false
          bonusInfo.isAnimationStamp = false
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
            let userAchievementNewestChange, userAchievement
            if (userAchievementQuerySnapshot.empty) {
              const bonus = 0
              vueModel.composeBonusInfo({
                continuous: 0,
                bonus: bonus
              })
              vueModel.determineShowReceivedBonusBtn(bonus)
              return
            }

            userAchievementNewestChange = userAchievementQuerySnapshot.docChanges().last()
            userAchievement = userAchievementNewestChange.doc.data()
            switch (userAchievementNewestChange.type) {
              case 'added': {
                vueModel.composeBonusInfo(userAchievement)
                vueModel.determineShowReceivedBonusBtn(userAchievement.bonus)
                break
              }

              case 'modified': {
                let comboBonus = userAchievement.continuous % vueModel.LIMITED_SHOW_COMBO_BONUS
                vueModel.bonusUnReceived = userAchievement.bonus
                if (comboBonus === 0 && vueModel.bonusUnReceived === 0) {
                  for (let index = comboBonus; index < vueModel.LIMITED_SHOW_COMBO_BONUS; index++) {
                    Vue.set(vueModel.bonuses, index, {
                        isStampFinish: false,
                        isStampNone: true,
                        isAnimationStamp: false
                      }
                    )
                  }
                  break
                }

                if (comboBonus !== vueModel.currentComboBonus) {
                  vueModel.currentComboBonus = comboBonus
                  if (comboBonus === 0 && userAchievement.bonus > 0) {
                    comboBonus = 4
                  }

                  for (let index = 0; index <= comboBonus; index++) {
                    let stampInfo
                    if (index === comboBonus) {
                      stampInfo = {
                        isStampFinish: true,
                        isStampNone: false,
                        isAnimationStamp: true
                      }
                    } else {
                      stampInfo = {
                        isStampFinish: true,
                        isStampNone: false,
                        isAnimationStamp: false
                      }
                    }

                    Vue.set(vueModel.bonuses, index, stampInfo)
                  }

                  for (let index = comboBonus; index < vueModel.LIMITED_SHOW_COMBO_BONUS; index++) {
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