import { db, fireStoreAuth } from './firestore/firebase-config'
import singleCourse from './components/single-course'

export default {
  name: 'courses',
  el: '#courses',
  data () {
    const vueModel = this
    return {
      courses: {},
      userCourseOriginalRef: db.collection('UserCourse'),
      ehanlinUser: window.ehanlinUser,
      now: vueModel.$dayjs(Date.now()),
      oneYearAgo: vueModel.$dayjs().subtract(1, 'year').toDate()
    }
  },
  components: {
    'course': singleCourse
  },

  async mounted () {
    const vueModel = this
    await fireStoreAuth()
    await vueModel.userCoursesHandler()
    await vueModel.initialBanner()
  },

  methods: {
    determineCourseStatus (startDate, endDate, status) {
      const vueModel = this
      const nowDiffMinStartDate = vueModel.now.diff(startDate, 'minutes')
      const nowBeforeEndDate = vueModel.now.isBefore(endDate)

      // 準備開始上課
      const isReady = (nowDiffMinStartDate < 0 && Math.abs(nowDiffMinStartDate) < 60)

      // 可開始上課
      const isStart = (nowDiffMinStartDate > 0 && nowBeforeEndDate && !status)

      // 補課中
      const isAdd = (!nowBeforeEndDate && !status.finished && !status.checked && !status.rejected)

      // 老師審核中
      const isCheck = (status && status.finished && (!status.checked || status.rejected))

      // 完成課程審核，待領獎
      const isDone = (status && status.checked && !status.received)

      const retrieveCourseStatus = ({ isReady, isStart, isAdd, isCheck, isDone }) => {
        if (isReady) {
          return {
            classBtnCss: 'class-btn-ready',
            classBtnImg: './img/btn-ready.png'
          }
        }

        if (isStart) {
          return {
            classBtnCss: 'class-btn-start',
            classBtnImg: './img/btn-start.png'
          }
        }

        if (isAdd) {
          return {
            classBtnCss: 'class-btn-add',
            classBtnImg: './img/btn-add.png'
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
            classBtnImg: './img/btn-done.png'
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
      const startDate = vueModel.$dayjs(userCourse.start.toDate())
      const endDate = vueModel.$dayjs(userCourse.end.toDate())

      return Object.assign({
        date: startDate.format('YYYY-MM-DD'),
        time: startDate.format('HH:mm:ss'),
        subject: subject,
        unit: userCourse.name,
        tool: userCourse.description
      }, vueModel.determineCourseStatus(startDate, endDate, userCourse.status))
    },

    retrieveUserCourses (userCourseDocs) {
      const vueModel = this
      for (let userCourseDoc of userCourseDocs) {
        const id = userCourseDoc.id
        const data = userCourseDoc.data()
        Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(data))
      }
    },

    showBanner () {
      const vueModel = this
      if (Object.keys(vueModel.courses).length === 0) {
        $('.box.banner-finish').css({ display: '' })
      } else {
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
                Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(data))
                vueModel.showBanner()
                break
              }

              case 'modified': {
                const userCourse = data.userCourse
                if (userCourse.status.received === true) {
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
      let userCourseQuerySnapshot
      const vueModel = this

      vueModel.userCourseRef = vueModel.userCourseOriginalRef
        .where('userCourse.user', '==', vueModel.ehanlinUser)
        .where('userCourse.enabled', '==', true)
        .where('userCourse.visible', '==', true)
        .where('userCourse.start', '>=', vueModel.oneYearAgo)
        .orderBy('userCourse.start', 'desc')

      userCourseQuerySnapshot = await vueModel.userCourseRef.get()
      vueModel.retrieveUserCourses(userCourseQuerySnapshot.docs)
      vueModel.listeningOnUserCourseChange()
    },

    async initialBanner () {
      const vueModel = this
      let userPlanQuerySnapshot, userCourseQuerySnapshot
      let isBannerBuyEcoach
      let isBannerArrange
      let isBannerFinish

      userPlanQuerySnapshot = await db.collection('UserPlan')
        .where('user', '==', vueModel.ehanlinUser)

      isBannerBuyEcoach = userPlanQuerySnapshot.empty
      if (!isBannerBuyEcoach) {
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
          console.log($('.box.banner-finish'))
          $('.box.banner-finish').css({ display: '' })
        }
      }

      determineBanner({ isBannerBuyEcoach, isBannerArrange, isBannerFinish })
    }

  }
}