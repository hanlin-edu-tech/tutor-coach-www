import {db, collection, query, onSnapshot, where, orderBy, getDocs, ehanlinAuth} from './firestore/firebase-config'
import singleCourse from './components/single-course'
import {messageModal, resultModal} from './util/show-modal'
import {PopupText} from './util/modal-text'

export default {
  name: 'courses',
  el: '#courses',
  data() {
    const vueModel = this
    return {
      courses: {},
      userCourseOriginalRef: collection(db, 'UserCourse'),
      ehanlinUser: '',
      now: vueModel.$dayjs(Date.now()),
      scheduleMap: new Map(),
      oneYearAgo: vueModel.$dayjs().subtract(1, 'year').toDate()
    }
  },
  components: {
    course: singleCourse
  },
  computed:{
    sortedCourse(){
      return Object.entries(this.courses)
          .sort(([, a], [, b]) => new Date(b.start) - new Date(a.start))
          .reduce((r, [k, v]) => ({...r, [k]: v}), {})
    }
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

      // 三天前的早上7點開放
      var date = new Date(startDate);
      date.setHours(7, 0, 0, 0);
      date.setDate(date.getDate() - 3);
      const beforeClassTime = vueModel.$dayjs(date).diff(startDate, 'second')
      // 一般課堂狀態
      const isStart = (
        nowDiffMinStartDate >= beforeClassTime && nowBeforeEndDate
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
        const video = userCourse['video']
        console.log(userCourseId, eTutorUrl, video)
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
              if(video){
                window.location.href = `/coach-web/enterTutorCourse.html?id=${userCourseId}`
              } else {
                $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/${userCourseId}/enterTutorCourse`,
                })
                userCourse.tutorEnter = true
                window.open(eTutorUrl, '_blank')
              }
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
              if(video){
                window.location.href = `/coach-web/enterTutorCourse.html?id=${userCourseId}`
              } else {
                $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/${userCourseId}/enterTutorCourse`,
                })
                userCourse.tutorEnter = true
                window.open(eTutorUrl, '_blank')
              }
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
              if(video){
                window.location.href = `/coach-web/enterTutorCourse.html?id=${userCourseId}`
              } else {
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
            if(video){
              window.location.href = `/coach-web/enterTutorCourse.html?id=${userCourseId}`
            } else {
              $.ajax({
                type: 'PUT',
                contentType: 'application/json',
                url: `/coach-web/${userCourseId}/enterTutorCourse`,
              })
              userCourse.tutorEnter = true
              window.open(eTutorUrl, '_blank')
            }
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
      if(su.length > 4) {
        if (su[3].indexOf("en") !== -1) {
          subjectIcon = "./img/icon/en.png"
        } else if (su[3].indexOf("ma") !== -1) {
          subjectIcon = "./img/icon/ma.png"
        } else if (su[3].indexOf("na") !== -1) {
          subjectIcon = "./img/icon/na.png"
        } else if (su[3].indexOf("pc") !== -1) {
          subjectIcon = "./img/icon/pc.png"
        } else if (su[3].indexOf("so") !== -1) {
          subjectIcon = "./img/icon/so.png"
        }
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
      if(data.userCourseItem.length === 0 && !userCourse.eTutorUrl && (
          !userCourse.info.syncCount || userCourse.info.syncCount < 3)){
        this.checkUserCourse(userCourse._id)
      }
      if(id === "65d443c227f3945df7460ab0"){
        console.log("data.userCourseItem.length:", (data.userCourseItem))
        console.log("data.userCourseItem.length:", (data.userCourseItem.length > 0))
        console.log("userCourse.eTutorUrl != null:", (userCourse.eTutorUrl != null))
      }

      return Object.assign({
        start: userCourse.start.toDate(),
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
      const userCourse = data.userCourse
      const status = userCourse.status
      const statusCount = !!status ? Object.keys(status).length : 0
      const endDate = vueModel.$dayjs(userCourse.end.toDate())
      if (statusCount >= 0 && !status.hasOwnProperty('received') &&
          !((userCourse.name.indexOf("課後作業") === -1 && userCourse.type === "自學課堂") && (status.hasOwnProperty('finished') || vueModel.now.isAfter(endDate)))) {
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

      onSnapshot(vueModel.userCourseRef, (querySnapshot) => {
          const changes = querySnapshot.docChanges();
          if (changes.length > 0) {
            const userCourseNewestChange = changes[changes.length - 1];
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

                const endDate = vueModel.$dayjs(userCourse.end.toDate())
                if (!((userCourse.name.indexOf("課後作業") === -1 && userCourse.type === "自學課堂") && (status.hasOwnProperty('finished') || vueModel.now.isAfter(endDate)))) {
                  Vue.set(vueModel.courses, id, vueModel.attachPreventDoubleClick(id, data))
                }
                break
              }

              case 'removed': {
                vueModel.removeCourse(id)
                break
              }
            }
          }
      });
    },
    checkUserCourse(id) {
      fetch(`/coach-web/checkUserCourse?courseId=${id}`,{
        method: "GET",
        headers: {"content-type":"application/json"},
      }).then(res => {
        if(res.ok){
          console.log("sync!")
        }
      })
    },

    async userAssetsHandler() {
      fetch(`/student-asset/totalAssets`,{
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
      vueModel.userCourseRef = query(vueModel.userCourseOriginalRef,
          where('userCourse.user', '==', vueModel.ehanlinUser),
          where('userCourse.enabled', '==', true),
          where('userCourse.visible', '==', true),
          where('userCourse.start', '>=', vueModel.oneYearAgo),
          orderBy('userCourse.start', 'asc')
      );

      userCourseQuerySnapshot = await getDocs(vueModel.userCourseRef)
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

      const q = query(collection(db, 'UserPlan'),
          where('user', '==', vueModel.ehanlinUser),
          where('enabled', '==', true)
      );
      userPlanQuerySnapshot = await getDocs(q);

      isBannerBuyEcoach = !!userPlanQuerySnapshot.empty
      if (isBannerBuyEcoach === false) {
        const q = query(vueModel.userCourseOriginalRef,
            where('userCourse.user', '==', vueModel.ehanlinUser),
            where('userCourse.enabled', '==', true)
        );
        userCourseQuerySnapshot = await getDocs(q);

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
        // 無課程不顯示icon
        return ['no-class']
      }
      if (isDone || isRejected) {
        return ['done', 'class-btn-done', './img/btn-done-purple.png']
      }
      if (nowDiffMinStartDate < -(20 * 60)) {
        return ['not-ready', 'disabled', './img/btn-eTutor-noclass.png']
      }
      if (nowDiffMinStartDate >= -(20 * 60) && nowDiffMinStartDate < 0) {
        return ['ready', 'class-btn-start focus-animation', './img/btn-eTutor-ready.png']
      }
      const thirtyMin = 30 * 60
      if(!tutorStarted && nowDiffMinStartDate > thirtyMin){
        return ['expired', '', './img/btn-check-error.png']
      }
      return ['start', '', './img/btn-eTutor-ready.png']
    },
    triggerAutoChangeState(id, userCourse, eTutorStatus, startDate, endDate){
      const vueModel = this
      const thirtyMin = 30 * 60
      const { tutorStarted } = userCourse.status;
      const hasETutorClassAndNotStarted = userCourse.eTutorUrl && !tutorStarted;
      const nowDiffMinStartDate = vueModel.$dayjs(Date.now()).diff(startDate, 'second')
      // 三天前的早上7點開放
      var date = new Date(startDate);
      date.setHours(7, 0, 0, 0);
      date.setDate(date.getDate() - 3);
      const beforeClassTime = vueModel.$dayjs(date).diff(startDate, 'second')
      const nowDiffMinEndDate = vueModel.$dayjs(Date.now()).diff(endDate, 'second')
      if(this.checkCourseIsLocked(userCourse)){
        if (vueModel.scheduleMap.has(id)) {
          const schedule = vueModel.scheduleMap.get(id)
          clearTimeout(schedule)
          vueModel.scheduleMap.delete(id)
        }
        return;
      }
      if (nowDiffMinStartDate < 0) {

        // 距開課日期三天以內才setTimeout
        let threeDays = -(3 * 24 * 60 * 60)
        // 提早20分鐘轉按鈕
        const waitTime = Math.abs(nowDiffMinStartDate)
        const twentyMin = 20 * 60

         // 三天前的早上7點轉狀態
        const waitTimeBeforeTagetTime = Math.abs(beforeClassTime-nowDiffMinStartDate)
        if(beforeClassTime>nowDiffMinStartDate){
          this.changeCourseState(id, userCourse, waitTimeBeforeTagetTime, endDate)
        }
        if (eTutorStatus === 'not-ready' && nowDiffMinStartDate > threeDays) {
          // 20分鐘前換狀態
          this.changeETutorToNextState(id, 'not-ready', waitTime - twentyMin, userCourse)
        }else if (eTutorStatus === 'ready') {
          this.changeETutorToNextState(id, 'ready', waitTime, userCourse)
        }
      } else {
        this.changeCourseStateToAdd(id, userCourse, nowDiffMinEndDate)
      }
      // 倒數計時30分鐘, 逾時鎖課程
      if(hasETutorClassAndNotStarted && Math.abs(nowDiffMinStartDate) <= thirtyMin){
        const waitTime = Math.abs(thirtyMin - nowDiffMinStartDate)
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
            // 20分鐘後再度改變狀態
            const twentyMin = 20 * 60
            this.changeETutorToNextState(id, 'ready', twentyMin, userCourse)
          }
        }, waitTime * 1000 + 300)
        vueModel.scheduleMap.set(id, schedule)
      }else if (state === 'ready') {
        const schedule = setTimeout(() => {
          if(!this.checkCourseIsLocked(userCourse)) {
            vueModel.courses[id].eTutorStatus = 'start'
            vueModel.courses[id].eTutorClassBtnCss = ''
            vueModel.courses[id].eTutorClassBtnImg = './img/btn-eTutor-ready.png'
            // 計時30分鐘遇時改變按鈕狀態
            const waitTime = 30 * 60
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
