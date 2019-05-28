// e導師close
$(".close-ecoach").click(function(){
    $(".ecoach").addClass("hide-coach");
    $(".ecoach-icon").addClass("show-icon");
});

$(".ecoach-icon").click(function(){
    $(".ecoach").removeClass("hide-coach");
    $(".ecoach-icon").removeClass("show-icon");
});