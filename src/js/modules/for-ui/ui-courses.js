import dataCourses from './data-courses'
import singleCourse from '../components/single-course'

export default {
  name: 'courses',
  el: '#courses',
  data () {
    return {
      courses: dataCourses
    }
  },
  components: {
    'course': singleCourse
  }
}