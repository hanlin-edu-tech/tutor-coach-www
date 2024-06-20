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
  },
  computed:{
    sortedCourse(){
      return Object.entries(this.courses)
          .sort(([, a], [, b]) => new Date(b.start) - new Date(a.start))
          .reduce((r, [k, v]) => ({...r, [k]: v}), {})
    }
  },
  mounted() {
    $(".points").html(30);
  },

}
