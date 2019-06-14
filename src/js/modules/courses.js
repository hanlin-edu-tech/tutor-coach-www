import { db, fireStoreAuth } from './firestore/firebase-config'
import singleCourse from './components/single-course'

export default {
  name: 'courses',
  el: '#courses',
  data () {
    const vueModel = this
    return {
      courses: {},
      ehanlinUser: window.ehanlinUser,
      now: vueModel.$dayjs(Date.now()),
      oneYearAgo: vueModel.$dayjs().subtract(1, 'year').toDate()
    }
  },
  components: {
    'course': singleCourse
  },

  async mounted () {
    let userCourseQuerySnapshot
    const vueModel = this
    await fireStoreAuth()

    vueModel.userCourseRef = db.collection('UserCourse')
      .where('userCourse.user', '==', vueModel.ehanlinUser)
      .where('userCourse.enabled', '==', true)
      .where('userCourse.visible', '==', true)
      .where('userCourse.start', '>=', vueModel.oneYearAgo)
      .orderBy('userCourse.start', 'desc')

    userCourseQuerySnapshot = await vueModel.userCourseRef.get()
    vueModel.retrieveUserCourses(userCourseQuerySnapshot.docs)
    vueModel.listeningOnUserCourseChange()
  },

  methods: {
    retrieveUserCourses (userCourseDocs) {
      const vueModel = this
      for (let userCourseDoc of userCourseDocs) {
        const id = userCourseDoc.id
        const data = userCourseDoc.data()
        const userCourse = data.userCourse
        Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(userCourse))
      }
    },

    composeCourseInfo (userCourse) {
      const vueModel = this
      const startDate = vueModel.$dayjs(userCourse.start.toDate())
      const endDate = vueModel.$dayjs(userCourse.end.toDate())

      return Object.assign({
        date: startDate.format('YYYY-MM-DD'),
        time: startDate.format('HH:mm:ss'),
        subject: userCourse.userPlan,
        unit: userCourse.name,
        tool: userCourse.description
      }, vueModel.determineCourseStatus(startDate, endDate, userCourse.status))
    },

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

    listeningOnUserCourseChange () {
      const vueModel = this
      vueModel.userCourseRef
        .onSnapshot(
          async userCourseQuerySnapshot => {
            const userCourseNewestChange = userCourseQuerySnapshot.docChanges().last()
            const id = userCourseNewestChange.doc.id
            const data = userCourseNewestChange.doc.data()
            const userCourse = data.userCourse

            switch (userCourseNewestChange.type) {
              case 'added': {
                Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(userCourse))
                break
              }

              case 'modified': {
                if (userCourse.enabled === false || userCourse.visible === false
                  || userCourse.status.received === true) {
                  Vue.delete(vueModel.courses, id)
                  break
                }
                Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(userCourse))
                break
              }

              case 'removed': {
                Vue.delete(vueModel.courses, id)
                break
              }
            }
          }
        )
    },
  }
}