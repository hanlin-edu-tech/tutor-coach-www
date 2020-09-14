import { db, ehanlinAuth } from './firestore/firebase-config'
import singleCourse from './components/single-course'
import showModal from './util/show-modal'
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
      await vueModel.userCoursesHandler()
      await vueModel.initialBanner()
    } catch (error) {
      console.error(error)
      showModal(PopupText.FIRE_STORE_ERROR)
    }
  },

  methods: {
    determineCourseStatus(id, userCourse, startDate, endDate) {
      const vueModel = this
      const nowDiffMinStartDate = vueModel.now.diff(startDate, 'second')
      const nowBeforeEndDate = vueModel.now.isBefore(endDate)
      const status = userCourse.status
      const statusCount = !!status ? Object.keys(status).length : 0
      const userCourseId = userCourse['_id']
      /*   deprecated 開始時間前一小時可進入自學課程     */
      // const hourSeconds = 3600
      // const isReady = (
      //   (nowDiffMinStartDate < 0 && Math.abs(nowDiffMinStartDate) < hourSeconds)
      //   && (
      //     statusCount === 0 || (statusCount === 1 && status.hasOwnProperty('started'))
      //   )
      // )

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

      // 倒數計時修改
      if (nowDiffMinStartDate < 0) {
        setTimeout(() => {
          vueModel.courses[id].classBtnCss = 'class-btn-start'
          vueModel.courses[id].classBtnImg = './img/btn-start.png'
          vueModel.courses[id].process = () => {
            if (window.sessionStorage) {
              sessionStorage.setItem('course', userCourseId)
              window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
            }
          }
          vueModel.courses[id].tutorProcess = () => {
            $.ajax({
              type: 'PUT',
              contentType: 'application/json',
              url: `/coach-web/${userCourseId}/enterTutorCourse`,
            })
          }
        }, Math.abs(vueModel.$dayjs(Date.now()).diff(startDate, 'second')) * 1000)
      }

      const retrieveETutorStatus = (userCourse, isDone, isRejected, nowDiffMinStartDate) => {
        if (!userCourse.eTutorUrl) {
          return 'no-class'
        }
        if (isDone || isRejected) {
          return isDone ? 'done' : 'rejected'
        }
        if (nowDiffMinStartDate < -300) {
          return 'not-ready'
        }
        if (nowDiffMinStartDate >= -300 && nowDiffMinStartDate < 0) {
          return 'ready'
        }
        if (nowDiffMinStartDate >= 0) {
          return 'start'
        }
      }
      const eTutorStatus = retrieveETutorStatus(userCourse, isDone, isRejected, nowDiffMinStartDate)
      const threeDays = -(3 * 24 * 60 * 60)
      // 距開課日期三天以內才setTimeout
      if (eTutorStatus === 'not-ready' && nowDiffMinStartDate > threeDays) {
        var aboutToReady = Math.abs(vueModel.$dayjs(Date.now()).diff(startDate, 'second') + 300)
        setTimeout(() => {
          vueModel.courses[id].eTutorStatus = 'ready'
        }, aboutToReady * 1000)
      }

      if (eTutorStatus === 'ready') {
        var aboutToStart = Math.abs(vueModel.$dayjs(Date.now()).diff(startDate, 'second'))
        setTimeout(() => {
          vueModel.courses[id].eTutorStatus = 'start'
        }, aboutToStart * 1000)
      }

      const retrieveCourseStatus = ({ isStart, isAdd, isCheck, isDone, isRejected, eTutorStatus }) => {
        const userCourseId = userCourse['_id']

        if (isStart) {
          return {
            classBtnCss: 'class-btn-start',
            classBtnImg: './img/btn-start.png',
            eTutorStatus: eTutorStatus,
            process: () => {
              if (window.sessionStorage) {
                sessionStorage.setItem('course', userCourseId)
                window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
              }
            },
            tutorProcess: () => {
              $.ajax({
                type: 'PUT',
                contentType: 'application/json',
                url: `/coach-web/${userCourseId}/enterTutorCourse`,
              })
            }
          }
        }

        if (isAdd) {
          return {
            classBtnCss: 'class-btn-add',
            classBtnImg: './img/btn-add.png',
            eTutorStatus: eTutorStatus,
            process: () => {
              if (window.sessionStorage) {
                sessionStorage.setItem('course', userCourseId)
                window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
              }
            },
            tutorProcess: () => {
              $.ajax({
                type: 'PUT',
                contentType: 'application/json',
                url: `/coach-web/${userCourseId}/enterTutorCourse`,
              })
            }
          }
        }

        if (isCheck) {
          return {
            classBtnCss: 'class-btn-check',
            classBtnImg: './img/btn-check.png',
            eTutorStatus: eTutorStatus,
          }
        }

        if (isDone) {
          return {
            classBtnCss: 'class-btn-done',
            classBtnImg: './img/btn-done.png',
            eTutorStatus: eTutorStatus,
            process: async () => {
              try {
                await $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `/coach-web/UserCourse/${userCourseId}/status/received`,
                })
              } catch (error) {
                console.error(error)
                showModal(PopupText.REWARD_ERROR)
              }
            }
          }
        }

        if (isRejected) {
          return {
            classBtnCss: 'class-btn-check-error',
            classBtnImg: './img/btn-check-error.png',
            eTutorStatus: eTutorStatus,
            process: async () => {
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
        }
      }

      return retrieveCourseStatus({ isStart, isAdd, isCheck, isDone, isRejected, eTutorStatus })
    },

    composeCourseInfo(id, data) {
      const vueModel = this
      const subject = data.userPlan.name
      const userCourse = data.userCourse
      const rewards = userCourse.rewards
      const startDate = vueModel.$dayjs(userCourse.start.toDate())
      const endDate = vueModel.$dayjs(userCourse.end.toDate())
      const coins = rewards
        .filter(reward => reward.type === 'coin')
        .map(reward => reward.amount)
        .reduce((prev, curr) => prev + curr)
      const gems = rewards
        .filter(reward => reward.type === 'gem')
        .map(reward => reward.amount)
        .reduce((prev, curr) => prev + curr)
      return Object.assign({
        date: startDate.format('YYYY-MM-DD'),
        time: `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`,
        subject: subject,
        unit: userCourse.name,
        tool: userCourse.description,
        eTutorUrl: userCourse.eTutorUrl,
        coins: coins,
        gems: gems,
        hasCourseItem: data.userCourseItem.length > 0,
        process: () => { },
        tutorProcess:() => {}
      }, vueModel.determineCourseStatus(id, userCourse, startDate, endDate))
    },

    attachPreventDoubleClick(id, data) {
      const vueModel = this
      const courseInfo = vueModel.composeCourseInfo(id, data)
      courseInfo.action = event => {
        event.stopPropagation()
        vueModel.$preventDoubleClick($(event.currentTarget), courseInfo.process)
      }
      courseInfo.tutorAction = event => {
        event.stopPropagation()
        vueModel.$preventDoubleClick($(event.currentTarget), courseInfo.tutorProcess)
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
                  let message
                  if (!result) {
                    break
                  }
                  message = result.message ? result.message.replace(/\n/g, '<br />') : ''
                  if (status.rejected) {
                    if (message) showModal(message)
                  } else if (result.rewards) {
                    const coins = result.rewards
                      .filter(reward => reward.type === 'coin')
                      .map(reward => reward.amount)
                      .reduce((prev, curr) => prev + curr)
                    const gems = result.rewards
                      .filter(reward => reward.type === 'gem')
                      .map(reward => reward.amount)
                      .reduce((prev, curr) => prev + curr)
                    showModal(PopupText.reward(coins, gems, message))
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
  }
}