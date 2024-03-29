import { db, ehanlinAuth } from './firestore/firebase-config'
import singleBonus from './components/single-bonus'
import {messageModal, chestModal, rewardsModal} from './util/show-modal'
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
    userAssetsHandler() {
      fetch(`/student-asset/totalAssets`,{
        method: "GET",
        headers: {"content-type":"application/json"},
      }).then(res => {
        if(res.ok) return res.json();
      }).then(result => {
        const asset = result.content;
        $(".ecoin").html(asset.coins);
        $(".diamond").html(asset.gems);
      })
    },

    onReceivedBonus () {
      const vueModel = this
      $('#bonus-received .btn-get').on('click', async () => {
        try {
          let res = await $.ajax({
            type: 'GET',
            url: '/coach-web/UserAchievement/check',
          })
          if(res !== "ok"){
            messageModal(res)
          } else {
            chestModal()
            $(".gift.chest").on('click', async () => {
              try {
                const receivedReward = await $.ajax({
                  type: 'PUT',
                  url: '/coach-web/UserAchievement/received',
                })
                let coins = receivedReward
                    .filter(reward => reward.type === 'coin')
                    .map(reward => reward.amount)
                    .reduce((prev, curr) => prev + curr, 0)
                let gems = receivedReward
                    .filter(reward => reward.type === 'gem')
                    .map(reward => reward.amount)
                    .reduce((prev, curr) => prev + curr, 0)
                let chestLevel = receivedReward
                    .filter(reward => reward.type === 'chest_level')
                    .map(reward => reward.amount)
                    .reduce((prev, curr) => prev + curr, 0)
                let chestCount = receivedReward
                    .filter(reward => reward.type === 'chest_count')
                    .map(reward => reward.amount)
                    .reduce((prev, curr) => prev + curr, 0)

                rewardsModal(coins, gems, chestLevel, chestCount)
                vueModel.userAssetsHandler()
                vueModel.bonusUnReceived--
                vueModel.determineShowReceivedBonusBtn(vueModel.bonusUnReceived)
              } catch (error) {
                console.error(error)
                messageModal(PopupText.REWARD_ERROR)
              }
            })
          }
        } catch (error) {
          console.error(error)
          if(error && error.responseJSON){
            messageModal(error.responseJSON.message)
          } else {
            messageModal(PopupText.REWARD_ERROR)
          }
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
                    comboBonus = 5
                  }

                  for (let index = 0; index < comboBonus; index++) {
                    let stampInfo
                    if (index === (comboBonus - 1)) {
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