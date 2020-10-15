(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const itemId = urlParams.get('itemId');
  const action = urlParams.get('action');
  if (window.sessionStorage) {
    sessionStorage.setItem('course', courseId);
    sessionStorage.setItem('action', "review");
  }
  if(action === "enterCourse"){
    window.location.href = `/coach-web/enterCourse.html?id=${courseId}`
  } else {
    window.location.href = `/coach-web/gotoCourseItem.html?id=${itemId}`
  }
})(window)