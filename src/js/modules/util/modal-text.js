const AuthText = {
  WARNING: '使用者尚未登入'
}

const PopupText = {
  reward (coins, gems, message = '') {
    return `恭喜獲得金幣 ${coins} 寶石 ${gems}<br/>${message}`
  },
  REWARD_ERROR: '獎勵領取失敗',
}

const ItemType = new Map()
ItemType.set('NU_EHANLIN-VIDEO', '教學影片')
ItemType.set('NU_EHANLIN-UNIT', '單元評量')
ItemType.set('NU_EHANLIN-QUIZ', '隨堂測驗')
ItemType.set('NU_EHANLIN-FIXED', '隨堂測驗')

const ItemIconClass = new Map()
ItemIconClass.set('NU_EHANLIN-VIDEO', 'flaticon-masterlist_video')
ItemIconClass.set('NU_EHANLIN-UNIT', 'flaticon-masterlist_experiment')
ItemIconClass.set('NU_EHANLIN-FIXED', 'flaticon-masterlist_experiment')
ItemIconClass.set('NU_EHANLIN-QUIZ', 'flaticon-masterlist_classquiz')

export {
  AuthText, PopupText, ItemType, ItemIconClass
}