$(".learn-list").sortable({
  draggable: ".learn-item",
  swapThreshold: 1,
  animation: 150,
  onUpdate: function (e) {
    var ids = [];
    $(".learn-item .learn-collection").each(function (i, elem) {
      ids.push($(elem).data("id"));
    });
    $.ajax({
      url: "/collection/reorder",
      type: "POST",
      data: { ids },
      success: function () {
        console.log("success");
      },
    });
  },
});

var getChapterOrders = function (elements) {
  var orders = [];
  elements.forEach((element) => {
    var chapterIds = [];
    element.find(".learn-item-chapter").each(function (i, elem) {
      chapterIds.push($(elem).data("id"));
    });
    orders.push({
      collectionId: element.prev().data("id"),
      chapterIds
    });
  });
  return orders;
}

var postChapterOrders = function (orders) {
  $.ajax({
    url: "/chapter/reorder",
    type: "POST",
    data: { orders },
    success: function () {
      console.log("success");
    },
  });
}

$(".learn-item-chapters").sortable({
  draggable: ".learn-item-chapter",
  group: "shared",
  swapThreshold: 1,
  animation: 150,
  onAdd: function (e) {
    var elements = [$(e.from), $(e.to)];
    var orders = getChapterOrders(elements);
    postChapterOrders(orders);
  },
  onUpdate: function (e) {
    var elements = [$(e.from)];
    var orders = getChapterOrders(elements);
    postChapterOrders(orders);
  },
});

$(document).on("dblclick", "span.editable", function () {
  var self = $(this);
  self.attr("spellcheck", "false");
  self.attr("contenteditable", "true");
  self.focus();
  document.execCommand("selectAll", false, null);
});

$(document).on("keydown", "span.editable", function (e) {
  e.stopPropagation();
  if (e.keyCode == 13) {
    e.preventDefault();
    $(this).attr("contenteditable", "false");
  }
});

$(document).on("blur", "span.editable", function (e) {
  var self = $(this);
  var parent = self.parent();
  self.attr("contenteditable", "false");

  var property = self.data("property");
  var value = self.text();
  var id = parent.data("id");
  var url = parent.hasClass("learn-collection") ? "/collection" : "/chapter";
  var data = {
    [property]: value,
  };
  $.ajax({
    method: "POST",
    url: url + "/update/" + id,
    data,
    success: function (res) {
      console.log("success");
    },
  });
});

$(document).on("click", ".icon-delete", function (e) {
  var self = $(this);
  var parent = self.parent();
  var id = parent.data("id");
  var url = parent.hasClass("learn-collection") ? "/collection" : "/chapter";

  $.ajax({
    method: "POST",
    url: url + "/delete/" + id,
    success: function (res) {
      if (url == "/collection") {
        self.closest(".learn-item").remove();
      } else {
        parent.remove();
      }
    },
  });
});

$(document).on("click", ".add-collection", function (e) {
  $.ajax({
    method: "POST",
    url: "/collection/create",
    dataType: "JSON",
    success: function (res) {
      var list = $(".learn-list");
      list.append(`
        <div class="learn-item">
          <div class="learn-collection" data-id="${res.id}">
            <div class="icon-delete">
              <img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/close-delete-btn.svg" width="12">
            </div>
            <span class="editable" data-property="title">${res.title}</span>
          </div>
          <div class="learn-item-chapters"></div>
          <div class="add-chapter">
            <img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/add-btn.svg" width="8" draggable="false">
          </div>
        </div>
      `);
    },
  });
});

$(document).on("click", ".add-chapter", function (e) {
  var self = $(this);
  var collectionId = self.siblings().eq(0).data("id");
  $.ajax({
    method: "POST",
    url: "/chapter/create",
    data: {
      collectionId,
    },
    dataType: "JSON",
    success: function (res) {
      var chapters = self.prev();
      chapters.append(`
        <div class="learn-item-chapter" data-id="${res.id}">
          <div class="icon-delete">
            <img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/close-delete-btn.svg" width="12">
          </div>
          <span class="editable" data-property="title">${res.title}</span>
          <span class="separator">:</span>
          <span class="editable" data-property="video">${res.video}</span>
        </div>
      `);
    },
  });
});
