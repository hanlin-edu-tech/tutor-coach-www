import { db, ehanlinAuth } from '../firestore/firebase-config'
import singleHistory from '../components/single-history'
import { ItemType, ItemIconClass } from '../util/modal-text'

export default {
  name: 'histories',
  el: '#histories',
  data () {
    return {
      histories: {},
      userCourseRef: db.collection('UserCourse'),
      userPlanRef: db.collection('UserPlan'),
      ehanlinUser: ''
    }
  },
  components: {
    history: singleHistory
  },

  async mounted () {
    const vueModel = this
    vueModel.ehanlinUser = await ehanlinAuth()
    vueModel.userCoursesHandler()
  },

  methods: {
    composeHistory (userCourseDoc) {
      const vueModel = this
      const data = userCourseDoc.data()

      const userCourse = data.userCourse
      const courseId = userCourse._id
      const courseName = userCourse.name
      const status = userCourse.status
      const result = userCourse.result
      let coins = 0, gems = 0, chests = 0
      if (result && result.rewards) {
        coins =  result.rewards.coin
        gems = result.rewards.gem
        chests = result.rewards.chest
      }

      const userPlan = data.userPlan
      const userPlanId = userPlan._id
      const userPlanName = userPlan.name

      const items = data.userCourseItem.map(
        item => {
          const itemStatus = item.status
          let startTime = '', finishedTime = ''
          if (!!itemStatus.started) {
            startTime = vueModel.$dayjs(itemStatus.started.toDate()).format('YYYY/MM/DD HH:mm')
          }
          if (!!itemStatus.finished) {
            finishedTime = vueModel.$dayjs(itemStatus.finished.toDate()).format('HH:mm')
          }
          return {
            _id: item._id,
            type: ItemType.get(item.type),
            name: item.name,
            redirect: () => {
              if (item.status && item.status.finished) {
                window.open(`./history-redirect.html?courseId=${courseId}&itemId=${item._id}&action=gotoCourseItem`, '_blank')
              } else if(item.status && item.status.started) {
                window.open(`./history-redirect.html?courseId=${courseId}&itemId=${item._id}&action=enterCourse`, '_blank')
              }
            },
            startTime: startTime,
            endTime: finishedTime,
            class: ItemIconClass.get(item.type),
            order: item.order
          }
        }
      ).sort((a, b) => {
        return a.order - b.order;
      });

      return {
        userPlanId,
        userPlanName,
        courseId,
        courseName: courseName,
        items: items,
        isChecked: (status && status.checked),
        isRejected: (status && status.rejected),
        coins: coins,
        gems: gems,
        chests: chests
      }
    },

    retrieveUserCourses (userCourseDocs) {
      const vueModel = this
      const userPlansTarget = $('#user-plans')
      const selectTarget = userPlansTarget.find('select')
      const historiesByUserPlan = userCourseDocs
        .map(vueModel.composeHistory)
        .groupBy('userPlanName')

      vueModel.historiesByUserPlan = historiesByUserPlan

      userPlansTarget.css({ display: '' })
      for (let userPlanName in historiesByUserPlan) {
        const option = new Option(userPlanName, userPlanName)
        selectTarget.append($(option))
      }
      selectTarget.on('change', (event) => {
        const userPlanName = $(event.currentTarget).val()
        vueModel.histories = historiesByUserPlan[userPlanName]
      })
    },

    listeningOnUserCourseChange () {
      const vueModel = this
      vueModel.userCourseRef
        .onSnapshot(
          async userCourseQuerySnapshot => {
            if (userCourseQuerySnapshot.empty) {
              return
            }
            const userCourseNewestChange = userCourseQuerySnapshot.docChanges().last()
            const id = userCourseNewestChange.doc.id
            const data = userCourseNewestChange.doc.data()

            const userCourse = data.userCourse
            const userPlan = data.userPlan
            const userPlanName = userPlan.name
            if (userCourseNewestChange.type === 'modified') {
              const histories = historiesByUserPlan[userPlanName]
              const isIncludingHistories = histories
                .some(history => {
                  return history.courseId === userCourse._id
                })

              if (!isIncludingHistories) {
                histories.push(
                  vueModel.composeHistory(userCourseNewestChange.doc)
                )
              }
            }
          }
        )
    },

    async userCoursesHandler () {
      const vueModel = this
      let userCourseQuerySnapshot
      vueModel.userCourseRef = vueModel.userCourseRef
        .where('userCourse.user', '==', vueModel.ehanlinUser)
        .where('userCourse.enabled', '==', true)
        .where('userCourse.visible', '==', true)
        .orderBy('userCourse.start', 'desc')

      userCourseQuerySnapshot = await vueModel.userCourseRef.get()
      if (!userCourseQuerySnapshot.empty) {
        vueModel.retrieveUserCourses(userCourseQuerySnapshot.docs)
        //vueModel.listeningOnUserCourseChange()
      } else {
        $('.noclass-record').css({ display: '' })
      }
    }
  }
}