import {rewardsCheckModal, rewardsModal, rewardsModalFail} from '../util/show-modal'

export default {
    props: {
        singleItem: {},
        index: 0
    },
    template: '#template-item',
    methods: {
        checkExchange() {
            rewardsCheckModal(this.singleItem.url,  this.singleItem.name, this.exchange);
        },
        exchange() {
            fetch(`/coach-web/eTutorStudent/exchange?itemId=${this.singleItem.id}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json;charset=utf-8"
                }
            }).then(async res => {
                if (res.ok) {
                    let result = await res.text();
                    if (result !== 'success') {
                        throw Error("兌換失敗");
                    } else {
                        rewardsModal(this.singleItem.url,  this.singleItem.name, '兌換成功');
                        await this.userAssetsHandler()
                    }
                } else {
                    throw Error("兌換失敗");
                }
            }).catch(_ => {
                rewardsModalFail(this.singleItem.url,  this.singleItem.name, '點數還不夠，再繼續加油喔!');
            })
        },
        async userAssetsHandler() {
            fetch(`/coach-web/eTutorStudent/assets`,{
                method: "GET",
                headers: {"content-type":"application/json"},
            }).then(res => {
                if(res.ok) return res.text();
            }).then(result => {
                if(result){
                    $(".points").html(result);
                }
            })
        },
    }
}
