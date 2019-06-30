import { db, ehanlinAuth } from './firestore/firebase-config'
import singleCourse from './components/single-course'
import showModal from './util/show-modal'

export default {
  name: 'courses',
  el: '#courses',
  data () {
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
    'course': singleCourse
  },

  async mounted () {
    const vueModel = this
    vueModel.ehanlinUser = await ehanlinAuth()
    await vueModel.userCoursesHandler()
    await vueModel.initialBanner()
  },

  methods: {
    determineCourseStatus (userCourse, startDate, endDate, coins, gems) {
      const vueModel = this
      const nowDiffMinStartDate = vueModel.now.diff(startDate, 'minutes')
      const nowBeforeEndDate = vueModel.now.isBefore(endDate)
      const status = userCourse.status

      // 準備開始上課
      const isReady = (nowDiffMinStartDate < 0 && Math.abs(nowDiffMinStartDate) < 60)

      // 可開始上課，已開始上課
      const isStart = (nowDiffMinStartDate > 0 && nowBeforeEndDate
        && (Object.keys(status).length === 0 || status.started && !status.finished && !status.checked))

      // 補課中
      const isAdd = (
        !nowBeforeEndDate
        && (!status || (status && (!status.finished && !status.checked && !status.rejected)))
      )

      // 老師審核中
      const isCheck = (status && status.finished && !status.checked)

      // 完成課程審核，待領獎
      const isDone = (status && status.checked && !status.received)

      // 課程審核不通過
      const isRejected = (status && status.rejected)

      const retrieveCourseStatus = ({ isReady, isStart, isAdd, isCheck, isDone }) => {
        const userCourseId = userCourse['_id']
        if (isReady) {
          return {
            classBtnCss: 'class-btn-ready',
            classBtnImg: './img/btn-ready.png'
          }
        }

        if (isStart) {
          return {
            classBtnCss: 'class-btn-start',
            classBtnImg: './img/btn-start.png',
            action: () => {
              if (window.sessionStorage) {
                sessionStorage.setItem('course', userCourseId)
                window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
              }
            }
          }
        }

        if (isAdd) {
          return {
            classBtnCss: 'class-btn-add',
            classBtnImg: './img/btn-add.png',
            action: () => {
              if (window.sessionStorage) {
                sessionStorage.setItem('course', userCourseId)
                window.location.href = `/coach-web/enterCourse.html?id=${userCourseId}`
              }
            }
          }
        }

        if (isCheck) {
          return {
            classBtnCss: 'class-btn-check',
            classBtnImg: './img/btn-check.png'
          }
        }

        if (isDone) {
          return {
            classBtnCss: 'class-btn-done',
            classBtnImg: './img/btn-done.png',
            action: async () => {
              try {
                await $.ajax({
                  type: 'PUT',
                  contentType: 'application/json',
                  url: `https://www.tbbt.com.tw/coach-web/UserCourse/${userCourseId}/status/received`,
                })
                showModal(`恭喜獲得金幣 ${coins} 寶石 ${gems}`)
              } catch (error) {
                console.error(error)
                showModal('獎勵領取失敗')
              }
            }
          }
        }

        if(isRejected) {
          return {
            classBtnCss: 'class-btn-check-error',
            classBtnImg: './img/btn-check-error.png',
          }
        }

        // 尚未開課
        return {
          classBtnCss: 'class-btn-noclass',
          classBtnImg: './img/btn-noclass.png'
        }
      }

      return retrieveCourseStatus({ isReady, isStart, isAdd, isCheck, isDone })
    },

    composeCourseInfo (data) {
      const vueModel = this
      const subject = data.userPlan.name
      const userCourse = data.userCourse
      const rewards = userCourse.rewards
      const startDate = vueModel.$dayjs(userCourse.start.toDate())
      const endDate = vueModel.$dayjs(userCourse.end.toDate())
      const coins = rewards.filter(reward => reward.type === 'coin').first().amount
      const gems = rewards.filter(reward => reward.type === 'gem').first().amount

      return Object.assign({
        date: startDate.format('YYYY-MM-DD'),
        time: `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`,
        subject: subject,
        unit: userCourse.name,
        tool: userCourse.description,
        coins: coins,
        gems: gems,
        action: () => {}
      }, vueModel.determineCourseStatus(userCourse, startDate, endDate, coins, gems))
    },

    filterStatusReceived (id, data, showBanner = () => {}) {
      const vueModel = this
      const status = data.userCourse.status
      if (status && !status.received) {
        Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(data))
        showBanner()
      }
    },

    retrieveUserCourses (userCourseDocs) {
      const vueModel = this
      userCourseDocs.forEach(
        userCourseDoc => {
          const id = userCourseDoc.id
          const data = userCourseDoc.data()
          vueModel.filterStatusReceived(id, data)
        })

      // for (let userCourseDoc of userCourseDocs) {
      //
      // }
    },

    showBanner () {
      const vueModel = this
      if (Object.keys(vueModel.courses).length === 0) {
        $('.box.banner-finish').css({ display: '' })
      } else {
        $('.box.banner-buy-ecoach').css({ display: 'none' })
        $('.box.banner-finish').css({ display: 'none' })
        $('.box.banner-arrange').css({ display: 'none' })
      }
    },

    listeningOnUserCourseChange () {
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
                  Vue.delete(vueModel.courses, id)
                  break
                }

                Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(data))
                break
              }

              case 'removed': {
                Vue.delete(vueModel.courses, id)
                vueModel.showBanner()
                break
              }
            }
          }
        )
    },

    async userCoursesHandler () {
      const vueModel = this
      let userCourseQuerySnapshot, userCourseDocs
      vueModel.userCourseRef = vueModel.userCourseOriginalRef
        .where('userCourse.user', '==', vueModel.ehanlinUser)
        .where('userCourse.enabled', '==', true)
        .where('userCourse.visible', '==', true)
        .where('userCourse.start', '>=', vueModel.oneYearAgo)
        .orderBy('userCourse.start', 'desc')

      userCourseQuerySnapshot = await vueModel.userCourseRef.get()
      if (!userCourseQuerySnapshot.empty) {
        vueModel.retrieveUserCourses(userCourseQuerySnapshot.docs)
        vueModel.listeningOnUserCourseChange()
      }
    },

    async initialBanner () {
      const vueModel = this
      let userPlanQuerySnapshot, userCourseQuerySnapshot
      let isBannerBuyEcoach
      let isBannerArrange
      let isBannerFinish

      userPlanQuerySnapshot = await db.collection('UserPlan')
        .where('user', '==', vueModel.ehanlinUser)

      isBannerBuyEcoach = (!userPlanQuerySnapshot.empty || userPlanQuerySnapshot.empty === true)
      if (isBannerBuyEcoach === false) {
        userCourseQuerySnapshot = await vueModel.userCourseOriginalRef
          .where('userCourse.user', '==', vueModel.ehanlinUser)
          .where('userCourse.enabled', '==', true)
          .get()

        isBannerArrange = userCourseQuerySnapshot.empty
        isBannerFinish = !userCourseQuerySnapshot.empty && (Object.keys(vueModel.courses).length === 0)
      }

      const determineBanner = ({ isBannerBuyEcoach, isBannerArrange, isBannerFinish }) => {
        if (isBannerBuyEcoach) {
          $('.box.banner-buy-ecoach').css({ display: '' })
        }

        if (isBannerArrange) {
          $('.box.banner-arrange').css({ display: '' })
        }

        if (isBannerFinish) {
          $('.box.banner-finish').css({ display: '' })
        }
      }

      determineBanner({ isBannerBuyEcoach, isBannerArrange, isBannerFinish })
    }
  }
}