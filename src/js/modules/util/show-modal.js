function messageModal(messageContent) {
  const modalTarget = $('.modal-message')
  const modalConTarget = modalTarget.find('.modal-con')
  modalConTarget.find('.content-gift').empty()
  modalConTarget.find('.content-gift').html(messageContent)
  modalConTarget.addClass('slideDown')
  modalTarget.addClass('visible')
}

function rewardsModal(img, name, message) {
  const modalTarget = $('.modal-rewards')
  const modalConTarget = modalTarget.find('.modal-con')
  modalConTarget.find(".item-award").find(".img-award").src = img;
  modalConTarget.find('.item-name-award').empty();
  modalConTarget.find('.item-name-award').html(name);
  modalConTarget.find('.item-message-award').empty();
  modalConTarget.find('.item-message-award').html(message);
  modalConTarget.addClass('slideDown')
  modalTarget.addClass('visible')
}

function resultModal(points, details) {
  const modalTarget = $('.modal-result');
  const modalConTarget = modalTarget.find('.modal-con');
  const selfStudy = modalConTarget.find('.self-study');
  const tutor = modalConTarget.find('.tutor');
  tutor.css("display", 'None');
  selfStudy.css("display", 'None');
  if(details && !isEmpty(details)){
    if(details['tutorTime']){
      let resultMap = new Map();
      resultMap.set('time-a', "準時到課");
      resultMap.set('time-b', "逾時到課");
      resultMap.set('time-c', "未到課");
      resultMap.set('concentrate-a', "專心");
      resultMap.set('concentrate-b', "普通");
      resultMap.set('concentrate-c', "不專心");
      resultMap.set('interactive-a', "良好");
      resultMap.set('interactive-b', "普通");
      resultMap.set('interactive-c', "不足");
      let tutorTime = details['tutorTime'];
      let concentrate = details['concentrate'];
      let interactive = details['interactive'];
      tutor.find('.tutorTime').empty();
      tutor.find('.tutorTime').html(resultMap.get(tutorTime));
      tutor.find('.concentrate').empty();
      tutor.find('.concentrate').html(resultMap.get(concentrate));
      tutor.find('.interactive').empty();
      tutor.find('.interactive').html(resultMap.get(interactive));
      tutor.css("display", '');
    } else {
      let resultMap = new Map();
      resultMap.set('time-a', "準時完成");
      resultMap.set('time-b', "逾時完成");
      resultMap.set('time-c', "未完成");
      resultMap.set('serious-a', "相當認真");
      resultMap.set('serious-b', "普通");
      resultMap.set('serious-c', "不認真");
      resultMap.set('achievement-a', "表現優異");
      resultMap.set('achievement-b', "符合學生程度");
      resultMap.set('achievement-c', "尚不熟練");
      let time = details['time'];
      let serious = details['serious'];
      let achievement = details['achievement'];
      selfStudy.find('.time').empty();
      selfStudy.find('.time').html(resultMap.get(time));
      selfStudy.find('.serious').empty();
      selfStudy.find('.serious').html(resultMap.get(serious));
      selfStudy.find('.achievement').empty();
      selfStudy.find('.achievement').html(resultMap.get(achievement));
      selfStudy.css("display", '');
    }
  }
  let isPointExist = false;
  if(points && points !== 0){
    modalConTarget.find('.point-number-award').empty();
    modalConTarget.find('.point-number-award').html(`x${points}`);
    isPointExist = true;
  }

  if(isPointExist){
    modalConTarget.find('.reward-detail').css("display", '');
    modalConTarget.find('.point-item-award').css("display", '');
  }else{
    modalConTarget.find('.reward-detail').css("display", 'None');
  }

  modalConTarget.addClass('slideDown');
  modalTarget.addClass('visible');
}

function isEmpty(obj) {
  for(let key in obj) {
    if(obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

export {
  messageModal, rewardsModal, resultModal
}
