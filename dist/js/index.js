// 滑鼠滑入顯示完整課名
$(function() {
    $("body").on("mouseenter", ".course-unit", function() {
        if (!this.title) this.title = $(this).text();
    });
});

// 使用者名稱超過20字則隱藏加上"..."
$(function () {
    var len = 22
    $('.course-unit').each(function (i) {
      if ($(this).text().length > len) {
        $(this).attr('title', $(this).text())
        var text = $(this).text().substring(0, len - 1) + '...'
        $(this).text(text)
      }
    })
  })

// 連續上課領獎popup
$(".btn-get").click(function(){
    $(".modal-con").addClass("slideDown");
    $(".modal").addClass("visible");
});
  
$(".js-close-modal").click(function(){
    $(".modal").removeClass("visible");
    $(".modal-con").removeClass("slideDown");
});

$(document).click(function(event) {
    if (!$(event.target).closest(".modal-con,.btn-get").length) {
        $("body").find(".modal").removeClass("visible");
    }
});

