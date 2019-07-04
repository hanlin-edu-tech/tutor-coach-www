export default modalContent => {
  const modalTarget = $('.modal')
  const modalConTarget = modalTarget.find('.modal-con')
  modalConTarget.find('.content-gift').empty()
  modalConTarget.find('.content-gift').html(modalContent)
  modalConTarget.addClass('slideDown')
  modalTarget.addClass('visible')
}