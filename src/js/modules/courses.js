import { db, ehanlinAuth } from './firestore/firebase-config'
import singleCourse from './components/single-course'
import {messageModal, resultModal} from './util/show-modal'
import { PopupText } from './util/modal-text'

export default {
  name: 'courses',
  el: '#courses',
  data() {
    const vueModel = this
    return {
      courses: {},
      userCourseOriginalRef: db.collection('UserCourse'),
      ehanlinUser: '',
      now: vueModel.$dayjs(Date.now()),
      scheduleMap: new Map(),
      oneYearAgo: vueModel.$dayjs().subtract(1, 'year').toDate()
    }
  },
  components: {
    course: singleCourse
  },

  async mounted() {
    const vueModel = this
    vueModel.ehanlinUser = await ehanlinAuth()

    try {
      await vueModel.userAssetsHandler()
      await vueModel.userCoursesHandler()
      await vueModel.initialBanner()
    } catch (error) {
      console.error(error)
      messageModal(PopupText.FIRE_STORE_ERROR)
    }
  },

  methods: {
    determineCourseStatus(id, userCourse, startDate, endDate) {
      const vueModel = this
      const nowDiffMinStartDate = vueModel.now.diff(startDate, 'second')
      const nowBeforeEndDate = vueModel.now.isBefore(endDate)
      const { tutorStarted, ...status } = userCourse.status;
      const statusCount = !!status ? Object.keys(status).length : 0

      // 一般課堂狀態
      // 已開始上課
      const isStart = (
        nowDiffMinStartDate >= 0 && nowBeforeEndDate
        && (
          statusCount === 0 || (statusCount === 1 && status.hasOwnProperty('started'))
        )
      )

      // 補課中
      const isAdd = (
        !nowBeforeEndDate
        && (
          statusCount === 0 || (statusCount === 1 && status.hasOwnProperty('started'))
        )
      )

      // 老師審核中
      const isCheck = (
        statusCount > 0
        && status.hasOwnProperty('finished')
        && !status.hasOwnProperty('checked')
        && !status.hasOwnProperty('rejected')
      )

      // 完成課程審核，待領獎
      const isDone = (
        statusCount > 0
        && status.hasOwnProperty('checked')
      )
      // 課程審核不通過
      const isRejected = (
        statusCount > 0
        && status.hasOwnProperty('rejected')
      )

      const [eTutorStatus, eTutorClassBtnCss, eTutorClassBtnImg] = this.retrieveETutorStatus(userCourse, isDone, isRejected,
          nowDiffMinStartDate, tutorStarted)
      // 倒數計時修改
      this.triggerAutoChangeState(id, userCourse, eTutorStatus, startDate, endDate)

      const retrieveCourseStatus = ({ isStart, isAdd, isCheck, isDone, isRejected,
                                      eTutorStatus, eTutorClassBtnCss, eTutorClassBtnImg, tutorStarted}) => {
        const userCourseId = userCourse['_id']
        const eTutorUrl = userCourse['eTutorUrl']

        if (isStart) {
          return {
            classBtnCss: 'class-btn-start',
            classBtnImg: './img/btn-start.png',
            eTutorStatus: eTutorStatus,
            eTutorClassBtnCss: eTutorClassBtnCss,
            eTutorClassBtnImg: eTutorClassBtnImg,
            process: () => {
              if (window.sessionStorage) {
                window.sessionStorage.setItem('course', userCourseId)
                window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
              }
            },
            eTutorProcess: () => {
              if(!tutorStarted){
                $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/${userCourseId}/enterTutorCourse`,
                })
              }
              userCourse.tutorEnter = true
              window.open(eTutorUrl, '_blank')
            }
          }
        }

        if (isAdd) {
          return {
            classBtnCss: 'class-btn-add',
            classBtnImg: './img/btn-add.png',
            eTutorStatus: eTutorStatus,
            eTutorClassBtnCss: eTutorClassBtnCss,
            eTutorClassBtnImg: eTutorClassBtnImg,
            process: () => {
              if (window.sessionStorage) {
                window.sessionStorage.setItem('course', userCourseId)
                window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
              }
            },
            eTutorProcess: () => {
              if(!tutorStarted){
                $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/${userCourseId}/enterTutorCourse`,
                })
              }
              userCourse.tutorEnter = true
              window.open(eTutorUrl, '_blank')
            }
          }
        }

        if (isCheck) {
          return {
            classBtnCss: 'class-btn-check',
            classBtnImg: './img/btn-check.png',
            eTutorStatus: eTutorStatus,
            eTutorClassBtnCss: eTutorClassBtnCss,
            eTutorClassBtnImg: eTutorClassBtnImg,
            eTutorProcess: () => {
              if(!tutorStarted){
                $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/${userCourseId}/enterTutorCourse`,
                })
              }
              userCourse.tutorEnter = true
              window.open(eTutorUrl, '_blank')
            }
          }
        }

        if (isDone) {
          return {
            classBtnCss: 'class-btn-done',
            classBtnImg: './img/btn-done-purple.png',
            eTutorStatus: eTutorStatus,
            eTutorClassBtnCss: eTutorClassBtnCss,
            eTutorClassBtnImg: eTutorClassBtnImg,
            process: async () => {
              try {
                let res = await $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/UserCourse/${userCourseId}/status/received`,
                })
                if(res !== "ok"){
                  messageModal(res)
                } else {
                  await vueModel.userAssetsHandler()
                }
              } catch (error) {
                messageModal(PopupText.REWARD_ERROR)
              }
            },
            eTutorProcess: async () => {
              try {
                let res = await $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/UserCourse/${userCourseId}/status/received`,
                })
                if(res !== "ok"){
                  messageModal(res)
                } else {
                  await vueModel.userAssetsHandler()
                }
              } catch (error) {
                console.error(error)
                messageModal(PopupText.REWARD_ERROR)
              }
            }
          }
        }

        if (isRejected) {
          return {
            classBtnCss: 'class-btn-done',
            classBtnImg: './img/btn-done-purple.png',
            eTutorStatus: eTutorStatus,
            eTutorClassBtnCss: eTutorClassBtnCss,
            eTutorClassBtnImg: eTutorClassBtnImg,
            process: async () => {
              await $.ajax({
                type: 'PUT',
                contentType: 'application/json',
                url: `/coach-web/UserCourse/${userCourseId}/status/received`,
              })
            },
            eTutorProcess:async () => {
              await $.ajax({
                type: 'PUT',
                contentType: 'application/json',
                url: `/coach-web/UserCourse/${userCourseId}/status/received`,
              })
            }
          }
        }

        // 尚未開課
        return {
          classBtnCss: 'class-btn-noclass',
          classBtnImg: './img/btn-noclass.png',
          eTutorStatus: eTutorStatus,
          eTutorClassBtnCss: eTutorClassBtnCss,
          eTutorClassBtnImg: eTutorClassBtnImg,
          eTutorProcess: () => {
            if(!tutorStarted){
              $.ajax({
                type: 'PUT',
                contentType: 'application/json',
                url: `/coach-web/${userCourseId}/enterTutorCourse`,
              })
            }
            userCourse.tutorEnter = true
            window.open(eTutorUrl, '_blank')
          }
        }
      }

      return retrieveCourseStatus({ isStart, isAdd, isCheck, isDone, isRejected, eTutorStatus, eTutorClassBtnCss,
        eTutorClassBtnImg, tutorStarted})
    },

    composeCourseInfo(id, data) {
      const vueModel = this
      const subject = data.userPlan.name
      const userCourse = data.userCourse
      let subjectIcon = "./img/icon/icon.png"
      let su = userCourse.userPlan.split("_")
      if(su.length > 4){
        subjectIcon = `./img/icon/${su[3]}.png`
      }
      const rewards = userCourse.rewards
      const startDate = vueModel.$dayjs(userCourse.start.toDate())
      const endDate = vueModel.$dayjs(userCourse.end.toDate())
      const coins =  rewards
            .filter(reward => reward.type === 'coin')
            .map(reward => reward.amount)
            .reduce((prev, curr) => prev + curr, 0)
      const gems = rewards
            .filter(reward => reward.type === 'gem')
            .map(reward => reward.amount)
            .reduce((prev, curr) => prev + curr, 0)
      const chestLevel = rewards
            .filter(reward => reward.type === 'chestLevel')
            .map(reward => reward.amount)
            .reduce((prev, curr) => prev + curr, 0)
      const chestCount = rewards
          .filter(reward => reward.type === 'chestCount')
          .map(reward => reward.amount)
          .reduce((prev, curr) => prev + curr, 0)
      return Object.assign({
        startDate: startDate.format('MM月DD日 HH:mm'),
        endDate: endDate.format('MM月DD日 HH:mm'),
        subject: subject,
        unit: userCourse.name,
        icon: subjectIcon,
        tool: userCourse.description,
        eTutorUrl: userCourse.eTutorUrl,
        coins: coins,
        gems: gems,
        chestLevel: chestLevel,
        chestCount: chestCount,
        hasCourseItem: data.userCourseItem.length > 0,
        hasETutorCourseItem: userCourse.eTutorUrl != null,
        process: () => { },
        eTutorProcess:() => {}
      }, vueModel.determineCourseStatus(id, userCourse, startDate, endDate))
    },

    attachPreventDoubleClick(id, data) {
      const vueModel = this
      const courseInfo = vueModel.composeCourseInfo(id, data)
      courseInfo.action = event => {
        event.stopPropagation()
        vueModel.$preventDoubleClick($(event.currentTarget), courseInfo.process)
      }
      courseInfo.eTutorAction = event => {
        event.stopPropagation()
        vueModel.$preventDoubleClick($(event.currentTarget), courseInfo.eTutorProcess)
      }
      return courseInfo
    },

    filterStatusReceived(id, data, showBanner = () => { }) {
      const vueModel = this
      const status = data.userCourse.status
      const statusCount = !!status ? Object.keys(status).length : 0

      if (statusCount >= 0 && !status.hasOwnProperty('received')) {
        Vue.set(vueModel.courses, id, vueModel.attachPreventDoubleClick(id, data))
        showBanner()
      }
    },

    retrieveUserCourses(userCourseDocs) {
      const vueModel = this
      userCourseDocs.forEach(
        userCourseDoc => {
          const id = userCourseDoc.id
          const data = userCourseDoc.data()
          vueModel.filterStatusReceived(id, data)
        })
    },

    showBanner() {
      const vueModel = this
      if (Object.keys(vueModel.courses).length === 0) {
        $('.box.banner-finish').css({ display: '' })
      } else {
        $('.box.banner-buy-ecoach').css({ display: 'none' })
        $('.box.banner-finish').css({ display: 'none' })
        $('.box.banner-arrange').css({ display: 'none' })
        $('.box.banner-soldout').css({ display: 'none' })
      }
    },

    removeCourse(id) {
      const vueModel = this
      Vue.delete(vueModel.courses, id)
      vueModel.showBanner()
    },

    listeningOnUserCourseChange() {
      const vueModel = this
      vueModel.userCourseRef
        .onSnapshot(
          async userCourseQuerySnapshot => {
            const userCourseNewestChange = userCourseQuerySnapshot.docChanges().last()
            if (!userCourseNewestChange) {
              return
            }

            const id = userCourseNewestChange.doc.id
            const data = userCourseNewestChange.doc.data()
            switch (userCourseNewestChange.type) {
              case 'added': {
                if (!vueModel.courses.hasOwnProperty(id)) {
                  vueModel.filterStatusReceived(id, data, vueModel.showBanner)
                }
                break
              }

              case 'modified': {
                const userCourse = data.userCourse
                const status = userCourse.status
                if (status && status.received) {
                  const result = userCourse.result
                  if (!result) {
                    break
                  }
                  if (status.rejected) {
                    if(result.rewardsDetails){
                      const details = result.rewardsDetails.rawData;
                      resultModal(0, 0, 0, 0, details)
                    }
                  } else if (result.rewards) {

                    const rewards = result.rewards;
                    let coins = 0, gems = 0, chestLevel = 1, chestCount = 0, details = {}
                    if(result.rewardsDetails){
                      coins = rewards.coin;
                      gems = rewards.gem;
                      chestLevel = rewards.chestLevel;
                      chestCount = rewards.chestCount;
                      details = result.rewardsDetails.rawData;
                    } else {
                      coins =  rewards
                          .filter(reward => reward.type === 'coin')
                          .map(reward => reward.amount)
                          .reduce((prev, curr) => prev + curr, 0)
                      gems = rewards
                          .filter(reward => reward.type === 'gem')
                          .map(reward => reward.amount)
                          .reduce((prev, curr) => prev + curr, 0)
                    }
                    resultModal(coins, gems, chestLevel, chestCount, details)
                  }
                  vueModel.removeCourse(id)
                  break
                }

                Vue.set(vueModel.courses, id, vueModel.attachPreventDoubleClick(id, data))
                break
              }

              case 'removed': {
                vueModel.removeCourse(id)
                break
              }
            }
          }
        )
    },
    async userAssetsHandler() {
      fetch(`/currencyBank/totalAssets?ts=${new Date().getTime()}`,{
        method: "GET",
        headers: {"content-type":"application/json"},
      }).then(res => {
        if(res.ok) return res.json();
      }).then(result => {
        if(result){
          const asset = result.content;
          $(".ecoin").html(asset.coins);
          $(".diamond").html(asset.gems);
        }
      })
    },

    async userCoursesHandler() {
      const vueModel = this
      let userCourseQuerySnapshot
      vueModel.userCourseRef = vueModel.userCourseOriginalRef
        .where('userCourse.user', '==', vueModel.ehanlinUser)
        .where('userCourse.enabled', '==', true)
        .where('userCourse.visible', '==', true)
        .where('userCourse.start', '>=', vueModel.oneYearAgo)
        .orderBy('userCourse.start', 'asc')

      userCourseQuerySnapshot = await vueModel.userCourseRef.get()
      if (!userCourseQuerySnapshot.empty) {
        vueModel.retrieveUserCourses(userCourseQuerySnapshot.docs)
        vueModel.listeningOnUserCourseChange()
      }
    },

    async initialBanner() {
      const vueModel = this
      let userPlanQuerySnapshot, userCourseQuerySnapshot
      let isBannerBuyEcoach
      let isBannerArrange
      let isBannerFinish

      userPlanQuerySnapshot = await db.collection('UserPlan')
        .where('user', '==', vueModel.ehanlinUser)
        .where('enabled', '==', true)
        .get()

      isBannerBuyEcoach = !!userPlanQuerySnapshot.empty
      if (isBannerBuyEcoach === false) {
        userCourseQuerySnapshot = await vueModel.userCourseOriginalRef
          .where('userCourse.user', '==', vueModel.ehanlinUser)
          .where('userCourse.enabled', '==', true)
          .get()

        isBannerArrange = !!userCourseQuerySnapshot.empty
        isBannerFinish = !userCourseQuerySnapshot.empty && (Object.keys(vueModel.courses).length === 0)
      }

      const determineBanner = ({ isBannerBuyEcoach, isBannerArrange, isBannerFinish }) => {
        if (isBannerBuyEcoach) {
          $('.box.banner-soldout').css({ display: '' })
        }

        if (isBannerArrange) {
          $('.box.banner-arrange').css({ display: '' })
        }

        if (isBannerFinish) {
          $('.box.banner-finish').css({ display: '' })
        }
      }

      determineBanner({ isBannerBuyEcoach, isBannerArrange, isBannerFinish })
    },
    retrieveETutorStatus (userCourse, isDone, isRejected, nowDiffMinStartDate, tutorStarted){
      if (!userCourse.eTutorUrl) {
        return ['no-class', 'no-class', './img/btn-eTutor-noclass.png']
      }
      if (isDone || isRejected) {
        return ['done', 'class-btn-done', './img/btn-done-purple.png']
      }
      if (nowDiffMinStartDate < -300) {
        return ['not-ready', 'disabled', './img/btn-eTutor-noclass.png']
      }
      if (nowDiffMinStartDate >= -300 && nowDiffMinStartDate < 0) {
        return ['ready', 'class-btn-start focus-animation', './img/btn-eTutor-ready.png']
      }
      const fifteenMin = 15 * 60
      if(!tutorStarted && nowDiffMinStartDate > fifteenMin){
        return ['expired', '', './img/btn-check-error.png']
      }
      return ['start', '', './img/btn-eTutor-ready.png']
    },
    triggerAutoChangeState(id, userCourse, eTutorStatus, startDate, endDate){
      const vueModel = this
      const fifteenMin = 15 * 60
      const { tutorStarted } = userCourse.status;
      const hasETutorClassAndNotStarted = userCourse.eTutorUrl && !tutorStarted;
      const nowDiffMinStartDate = vueModel.$dayjs(Date.now()).diff(startDate, 'second')
      const nowDiffMinEndDate = vueModel.$dayjs(Date.now()).diff(endDate, 'second')
      if(this.checkCourseIsLocked(userCourse)){
        if (vueModel.scheduleMap.has(id)) {
          const schedule = vueModel.scheduleMap.get(id)
          clearTimeout(schedule)
          vueModel.scheduleMap.delete(id)
        }
        return;
      }
      // 距開課日期三天以內才setTimeout
      const threeDays = -(3 * 24 * 60 * 60)
      if (nowDiffMinStartDate < 0) {
        const waitTime = Math.abs(nowDiffMinStartDate)
        if(nowDiffMinStartDate > threeDays){
          this.changeCourseState(id, userCourse, waitTime, endDate)
        }
        const threeDays = -(3 * 24 * 60 * 60)
        if (eTutorStatus === 'not-ready' && nowDiffMinStartDate > threeDays) {
          // 5分鐘前換狀態
          const fiveMin = 5 * 60
          this.changeETutorToNextState(id, 'not-ready', waitTime - fiveMin, userCourse)
        }else if (eTutorStatus === 'ready') {
          this.changeETutorToNextState(id, 'ready', waitTime, userCourse)
        }
      } else {
        this.changeCourseStateToAdd(id, userCourse, nowDiffMinEndDate)
      }
      // 倒數計時15分鐘, 逾時鎖課程
      if(hasETutorClassAndNotStarted && Math.abs(nowDiffMinStartDate) <= fifteenMin){
        const waitTime = Math.abs(fifteenMin - nowDiffMinStartDate)
        this.changeETutorToNextState(id, 'start', waitTime, userCourse)
      }
    },
    changeCourseState(id, userCourse, waitTime, endDate){
      const vueModel = this
      const schedule = setTimeout(() => {
        vueModel.courses[id].classBtnCss = 'class-btn-start'
        vueModel.courses[id].classBtnImg = './img/btn-start.png'
        vueModel.courses[id].process = () => {
          if (window.sessionStorage) {
            window.sessionStorage.setItem('course', userCourse["_id"])
            window.location.href = `/coach-web/enterCourse.html?id=${userCourse["_id"]}`
          }
        }
        const nowDiffMinEndDate = vueModel.$dayjs(Date.now()).diff(endDate, 'second')
        this.changeCourseStateToAdd(id, userCourse,  nowDiffMinEndDate)
      }, waitTime * 1000 + 300)
      vueModel.scheduleMap.set(id, schedule)
    },
    changeCourseStateToAdd(id, userCourse, waitTime){
      const vueModel = this
      const  schedule = setTimeout(() => {
        if(!this.checkCourseIsLocked(userCourse)){
          vueModel.courses[id].classBtnCss = 'class-btn-add'
          vueModel.courses[id].classBtnImg = './img/btn-add.png'
          vueModel.courses[id].process = () => {
            if (window.sessionStorage) {
              window.sessionStorage.setItem('course', userCourse["_id"])
              window.location.href = `/coach-web/enterCourse.html?id=${userCourse["_id"]}`
            }
          }
        }
      }, Math.abs(waitTime) * 1000 + 300)
      vueModel.scheduleMap.set(id, schedule)
    },
    changeETutorToNextState(id, state, waitTime, userCourse){
      const vueModel = this
      if (state === 'not-ready') {
        const schedule = setTimeout(() => {
          if(!this.checkCourseIsLocked(userCourse)) {
            vueModel.courses[id].eTutorStatus = 'ready'
            vueModel.courses[id].eTutorClassBtnCss = 'class-btn-start focus-animation'
            vueModel.courses[id].eTutorClassBtnImg = './img/btn-eTutor-ready.png'
            // 5分鐘後再度改變狀態
            const fiveMin = 5 * 60
            this.changeETutorToNextState(id, 'ready', fiveMin, userCourse)
          }
        }, waitTime * 1000 + 300)
        vueModel.scheduleMap.set(id, schedule)
      }else if (state === 'ready') {
        const schedule = setTimeout(() => {
          if(!this.checkCourseIsLocked(userCourse)) {
            vueModel.courses[id].eTutorStatus = 'start'
            vueModel.courses[id].eTutorClassBtnCss = ''
            vueModel.courses[id].eTutorClassBtnImg = './img/btn-eTutor-ready.png'
            // 計時15分鐘遇時改變按鈕狀態
            const waitTime = 15 * 60
            this.changeETutorToNextState(id, 'start', waitTime, userCourse)
          }
        }, waitTime * 1000 + 300)
        vueModel.scheduleMap.set(id, schedule)
      } else if(state === 'start'){
        const schedule = setTimeout(() => {
          if(!userCourse.tutorEnter && !this.checkCourseIsLocked(userCourse)){
            vueModel.courses[id].eTutorStatus = 'expired'
            vueModel.courses[id].eTutorClassBtnCss = ''
            vueModel.courses[id].eTutorClassBtnImg = './img/btn-check-error.png'
          }
        }, waitTime * 1000 + 300)
        vueModel.scheduleMap.set(id, schedule)
      }
    },
    checkCourseIsLocked(userCourse) {
      return userCourse.status.checked || userCourse.status.rejected || userCourse.status.finished
    }

  }
}