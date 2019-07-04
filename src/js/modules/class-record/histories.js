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
      let coins = 0, gems = 0, message = ''
      if (result && result.rewards) {
        coins = result.rewards.filter(reward => reward.type === 'coin').first().amount
        gems = result.rewards.filter(reward => reward.type === 'gem').first().amount
      }

      if (result && result.message) {
        message = result.message.replace(/\n/g, '<br />')
      }

      const userPlan = data.userPlan
      const userPlanId = userPlan._id
      const userPlanName = userPlan.name

      const items = data.userCourseItem.map(
        item => {
          const itemStatus = item.status
          let startTime, finishedTime
          if (status.started) {
            startTime = vueModel.$dayjs(itemStatus.started.toDate()).format('YYYY/MM/DD HH:mm')
            finishedTime = vueModel.$dayjs(itemStatus.finished.toDate()).format('HH:mm')
          }

          return {
            _id: item._id,
            type: ItemType.get(item.type),
            name: item.name,
            redirect: () => {
              if ((status && status.checked)) {
                window.location.href = `/coach-web/gotoCourseItem.html?id=${item._id}`
              }
            },
            startTime: startTime,
            endTime: finishedTime,
            class: ItemIconClass.get(item.type)
          }
        }
      )

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
        message: `老師的話：${message}`
      }
    },

    retrieveUserCourses (userCourseDocs) {
      const vueModel = this
      const userPlansTarget = $('#user-plans')
      const selectTarget = userPlansTarget.find('select')
      const historiesByUserPlan = userCourseDocs
        .filter(
          userCourseDoc => {
            const data = userCourseDoc.data()
            const status = data.userCourse.status
            return (status && (status.checked || status.rejected))
          })
        .map(vueModel.composeHistory)
        .groupBy('userPlanName')

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

            if (userCourseNewestChange.type === 'added') {
              if (!vueModel.courses.hasOwnProperty(id)) {
                vueModel.filterStatusReceived(id, data, vueModel.showBanner)
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
      }
    },

    initialUserPlan () {
      const vueModel = this
      vueModel.userPlanRef
        .where('user', '==', vueModel.ehanlinUser)
        .where('enabled', '==', true)
        .orderBy('start', 'desc')
        .onSnapshot(
          async userPlanQuerySnapshot => {
            if (userPlanQuerySnapshot.empty) {
              return
            }

            userPlanQuerySnapshot.docChanges()
              .forEach(
                userPlanChange => {
                  if (userPlanChange.type === 'added') {
                    const userPlan = userPlanChange.doc.data()
                    const option = new Option(userPlan.name, userPlan._id)
                    $('#user-plans').append($(option))
                  }
                }
              )
          }
        )
    }
  }
}