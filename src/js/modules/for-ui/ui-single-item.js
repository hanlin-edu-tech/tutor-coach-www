import {rewardsModal, rewardsModalFail} from '../util/show-modal'

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
                rewardsModalFail(this.singleItem.url,  this.singleItem.name, '點數還不夠，再繼續加油喔!');
            }
        }
    }
}
