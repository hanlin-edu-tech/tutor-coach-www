import {rewardsModal} from '../util/show-modal'

export default {
    props: {
        singleItem: {},
        index: 0
    },
    template: '#template-item',
    methods: {
        exchange() {
            let points = $(".points").html();
            if(points >= this.singleItem.point){
                rewardsModal(this.singleItem.url,  this.singleItem.name, '兌換成功');
            } else {
                rewardsModal(this.singleItem.url,  this.singleItem.name, '兌換失敗');
            }
        }
    }
}
