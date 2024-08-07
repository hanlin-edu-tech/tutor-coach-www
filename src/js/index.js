
$(function () {
    // 滑鼠滑入顯示完整課名
    $("body").on("mouseenter", ".course-unit", function () {
        if (!this.title) this.title = $(this).text();
    });

    // 名稱超過20字則隱藏加上"..."
    var len = 22
    $('.course-unit').each(function (i) {
        if ($(this).text().length > len) {
            $(this).attr('title', $(this).text())
            var text = $(this).text().substring(0, len - 1) + '...'
            $(this).text(text)
        }
    })

    $(".js-close-modal").click(function () {
        $(".modal").removeClass("visible");
        $(".modal-con").removeClass("slideDown");
    });

    let cookieToken = getEhToken();
    sessionStorage.removeItem('action');
    if (cookieToken != null) {
        let user = cookieToken.user;
        if (user == null) {
            window.location.href = `/app/member-center/login.html?redirect=/app/coach/`;
        }
    }

    $(document).click(function (event) {
        if (!$(event.target).closest(".modal-con,.btn-get").length) {
            $("body").find(".modal").removeClass("visible");
        }
    });
})
