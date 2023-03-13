var accordion = (function () {
  var $accordion = $(".js-accordion");
  var $accordion_header = $accordion.find(".js-accordion-header");
  var $accordion_item = $(".js-accordion-item");

  // default settings
  var settings = {
    // animation speed
    speed: 400,

    // close all other accordion items if true
    oneOpen: false,
  };

  return {
    // pass configurable object literal
    init: function ($settings) {
      $accordion_header.on("click", function () {
        accordion.toggle($(this));
      });

      $.extend(settings, $settings);

      // ensure only one accordion is active if oneOpen is true
      if (settings.oneOpen && $(".js-accordion-item.active").length > 1) {
        $(".js-accordion-item.active:not(:first)").removeClass("active");
      }

      // reveal the active accordion bodies
      $(".js-accordion-item.active").find("> .js-accordion-body").show();
      $(".js-accordion-item-inner.active").find("> .js-accordion-body").show();
    },
    toggle: function ($this) {
      if (
        settings.oneOpen &&
        $this[0] !=
          $this
            .closest(".js-accordion")
            .find("> .js-accordion-item.active > .js-accordion-header")[0]
      ) {
        $this
          .closest(".js-accordion")
          .find("> .js-accordion-item")
          .removeClass("active")
          .find(".js-accordion-body")
          .slideUp();
      }

      // show/hide the clicked accordion item
      $this.closest(".js-accordion-item").toggleClass("active");
      $this.next().stop().slideToggle(settings.speed);
    },
    close: function ($this) {
      $this
        .find(".js-accordion-item")
        .removeClass("active")
        .find(".js-accordion-body")
        .hide();
    },
  };
})();
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
$(document).ready(function () {
  accordion.init({
    speed: 300,
    oneOpen: true,
  });
  $(".arcadestudio-title").on("mouseenter", function () {
      if(!$(".title-block").hasClass("opened")){
        $(".title-block").addClass("ready");
      }
  });
  $(".menu-hamburger").on("mousedown", function () {
      if(!$(".title-block").hasClass("opened")){
          openSideMenu();
      }else{
          closeSideMenu();
      }

  });
  $(".title-block").on("mouseleave", function () {
    //  $(".title-block").removeClass("ready")
  });


});
$(".submit-button").on("click", function (e) {
  e.preventDefault();
  const $formBlock = $(this).closest(".form-block");

  var t = $(document.head).find("meta[name=csrf-token]");
  var csrfToken = ""
  if(t.length==1){
    csrfToken = t.attr("content")
  }
  if(!validateEmail($formBlock.find('[name="email"]').val())){
    $formBlock.find(".w-form-result.email").fadeIn().delay(1000).fadeOut();
  }else{
    $.ajax({
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Csrf-Token', csrfToken);
        xhr.setRequestHeader('X-Csrf-Token', csrfToken);
      },

      url: "/contact",
      type: "POST",
      data: {
        name: $formBlock.find('[name="name"]').val(),
        email: $formBlock.find('[name="email"]').val(),
        message: $formBlock.find('[name="message"]').val(),
        type: $formBlock.find('[name="type"]').val()
      },
      success: function (res) {
        console.log(res);
        $formBlock.find(".w-form-result.success").fadeIn().delay(1500).fadeOut();
        window.setTimeout(()=>{
          $formBlock.find('[name="name"]').val("");
          $formBlock.find('[name="email"]').val("");
          $formBlock.find('[name="message"]').val("");
        }, 1500);
      },
      error: function (err) {
        console.log(err);
        $formBlock.find(".w-form-result.error").fadeIn().delay(1000).fadeOut();
      },
    });
  }
});

$("body").on("mousemove", checkIfNeedToClose)

function closeSideMenu(){
    accordion.close($(".side-menu"));

    $(".side-menu").animate({
      width: "toggle",
    });

    $(".title-block").removeClass("opened");
}
function openSideMenu(){
    var sidemenu = $(".side-menu");
    if (sidemenu.css("display") == "none") {
      sidemenu.animate({
        width: "toggle",
      });
        $(".title-block").addClass("opened");
    }
}
function checkIfNeedToClose(e){
    if($(".title-block").hasClass("opened")){
        if(e.pageX>480){
            closeSideMenu();
        }
    }
    if($(".title-block").hasClass("ready")){
        if(e.pageX>480){
            $(".title-block").removeClass("ready")
        }
    }
}
