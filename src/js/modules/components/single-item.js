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
                        throw Error(result);
                    } else {
                        rewardsModal(this.singleItem.url,  this.singleItem.name, '兌換成功');
                        await this.userAssetsHandler()
                    }
                } else {
                    throw Error("兌換失敗");
                }
            }).catch(err => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.log(`errorMessage: ${errorMessage}`);
                if (errorMessage === 'no enough points') {
                    rewardsModalFail(this.singleItem.url,  this.singleItem.name, '點數還不夠，再繼續加油喔!');
                } else if (errorMessage === 'no enough item') {
                    rewardsModalFail(this.singleItem.url,  this.singleItem.name, '獎品不足，補充後再來兌換喔!');
                } else {
                    rewardsModalFail(this.singleItem.url,  this.singleItem.name, '兌換失敗');
                }
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
