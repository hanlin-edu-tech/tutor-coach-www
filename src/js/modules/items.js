import singleItem from "./components/single-item";

export default {
  name: 'items',
  el: '#items',
  data () {
    return {
      items: []
    }
  },
  components: {
    'item': singleItem
  },

  async mounted () {
    const vueModel = this
    await vueModel.rewards();
  },

  methods: {
    async rewards() {
      const vueModel = this
      fetch(`/coach-web/eTutorStudent/rewards`,{
        method: "GET",
        headers: {"content-type":"application/json"},
      }).then(res => {
        if(res.ok) return res.json();
      }).then(result => {
        if(result){
          vueModel.items.push({
            id:"item1",
            url: `https://public.ehanlin.com.tw/ehanlin-theme-activity/${result["item1-awardId"]}.png`,
            name: result["item1-name"],
            point: result["item1-point"],
          })
          vueModel.items.push({
            id:"item2",
            url: `https://public.ehanlin.com.tw/ehanlin-theme-activity/${result["item2-awardId"]}.png`,
            name: result["item2-name"],
            point: result["item2-point"],
          })
          vueModel.items.push({
            id:"item3",
            url: `https://public.ehanlin.com.tw/ehanlin-theme-activity/${result["item3-awardId"]}.png`,
            name: result["item3-name"],
            point: result["item3-point"],
          })
          vueModel.items.push({
            id:"item4",
            url: `https://public.ehanlin.com.tw/ehanlin-theme-activity/${result["item4-awardId"]}.png`,
            name: result["item4-name"],
            point: result["item4-point"],
          })
        }
      })
    }
  }
}
