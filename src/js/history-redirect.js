(function () {
  const urlParams = new URLSearchParams(window.location.search)
  const itemId = urlParams.get('itemId')
  window.location.href = `/coach-web/gotoCourseItem.html?id=${itemId}`
})(window)