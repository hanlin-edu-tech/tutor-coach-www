import dataCourses from './data-courses'

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
    return {
      courses: dataCourses
    }
  },
  components: {
    'course': course
  }
}