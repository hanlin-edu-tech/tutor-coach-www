import { db, fireStoreAuth } from './firestore/firebase-config'

const eventBus = new Vue({});

const course = {
  props: {
    singleCourse: {}
  },
  template: '#template-course'
}

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
    'course': course
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
        subject: userCourse.name,
        unit: userCourse.description,
        tool: 'GG'
      }, vueModel.determineCourseStatus(startDate, endDate, userCourse.status))
    },

    determineCourseStatus (startDate, endDate, status) {
      const vueModel = this
      const nowDiffMinStartDate = vueModel.now.diff(startDate, 'minutes')
      const nowBeforeEndDate = vueModel.now.isBefore(endDate)

      //const isNoClass = (nowDiffMinStartDate < 0 && Math.abs(nowDiffMinStartDate) >= 60)
      const isReady = (nowDiffMinStartDate < 0 && Math.abs(nowDiffMinStartDate) < 60)
      const isStart = (nowDiffMinStartDate > 0 && nowBeforeEndDate && !status)
      const isAdd = (!nowBeforeEndDate && status && !status.checked && !status.rejected)
      const isCheck = (nowBeforeEndDate && status && status.checked && !status.received)
      const isDone = (nowBeforeEndDate && status && status.checked && status.received)

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
            console.log(userCourseNewestChange)
            const id = userCourseNewestChange.doc.id
            const data = userCourseNewestChange.doc.data()
            const userCourse = data.userCourse

            switch (userCourseNewestChange.type) {
              case 'added': {
                Vue.set(vueModel.courses, id, vueModel.composeCourseInfo(userCourse))
                break
              }

              case 'modified': {
                if (userCourse.enabled === false || userCourse.visible === false) {
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