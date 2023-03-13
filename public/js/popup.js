var popup = function (selector) {
  var elem = $(selector);
  var buttonCallback = null;

  elem.on("click", ".popup-close", function () {
    elem.css("display", "none");
  });

  elem.on("click", ".popup-button", function () {
    elem.css("display", "none");
    if (buttonCallback) {
      buttonCallback();
    }
  });

  return {
    find: function (selector) {
      return elem.find(selector)[0];
    },
    setAttribute: function (selector, attr, val) {
      elem.find(selector).attr(attr, val);
    },
    setText: function (selector, text) {
      elem.find(selector).text(text);
    },
    show: function () {
      elem.css("display", "flex").hide().fadeIn();
    },
    hide: function () {
      elem.css("display", "none");
    },
    onButton: function (callback) {
      buttonCallback = callback;
    },
  };
};
