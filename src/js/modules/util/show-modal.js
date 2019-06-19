export default modalContent => {
  console.log(modalContent)

  const modalTarget = $('.modal')
  const modalConTarget = modalTarget.find('.modal-con')
  modalConTarget.find('.content-gift').empty()
  modalConTarget.find('.content-gift').text(modalContent)

  modalTarget.find('.modal-con').addClass('slideDown')
  modalTarget.addClass('visible')
}