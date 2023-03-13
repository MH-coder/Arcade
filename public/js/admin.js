var admin = function () {
  function initRenameEvent() {
    $(document).on("dblclick", ".editable-object", function () {
      $(this).attr("spellcheck", "false");
      $(this).attr("contenteditable", "true");
      $(this).focus();
      document.execCommand("selectAll", false, null);
    });

    $(document).on("keydown", ".editable-object", function (e) {
      e.stopPropagation();
      if (e.keyCode == 13) {
        e.preventDefault();
        $(this).attr("contenteditable", "false");
      }
    });

    $(document).on("blur", ".editable-object", function (e) {
      var self = $(this);
      var item = self.closest(".sample");
      var id = item.data("id");
      var attribute = self.data("attribute");
      var data = {
        [attribute]: self.text(),
      };

      self.attr("contenteditable", "false");

      $.ajax({
        url: "/admin/sample/" + id,
        type: "PUT",
        dataType: "JSON",
        data,
        success: function (res) {},
      });
    });
  }

  function initSample() {
    $(".add-sample").click(function () {
      $.ajax({
        url: "/admin/sample",
        type: "POST",
        dataType: "JSON",
        success: function (result) {
          if (result.status == "success") {
            var sample = result.sample;
            var gallery = $(".sample-gallery");
            var item = $(`<div class="sample no-border"></div>`);
            item.data("id", sample.id);
            item.data("slug", sample.slug);
            item.append(
              '<div class="delete-sample"><img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/close-delete-btn.svg" /></div>'
            );
            item.append('<div class="sample-img"></div>');

            var content = $(`<div class="sample-content"></div>`);
            content.append(
              `<div class="sample-title editable-object" data-attribute="title">Your title here</div>`
            );
            content.append(
              `<div class="sample-author editable-object" data-attribute="author">Your name here</div>`
            );
            content.append(
              `<div class="sample-slug"><span>/</span><span class="editable-object" data-attribute="slug">Your slug here</span></div>`
            );
            item.append(content);

            gallery.append(item);
          } else {
            alert(result.message);
          }
        },
      });
    });

    $(document).on("click", ".sample-img", function () {
      var self = $(this);
      var id = self.closest(".sample").data("id");
      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.addEventListener("change", function () {
        var formData = new FormData();
        formData.append("thumbnail", fileInput.files[0]);
        formData.append("id", id);
        $.ajax({
          url: "/admin/sample/thumbnail",
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          success: function (res) {
            self.css("background-image", `url(${res.url})`);
          },
        });
      });
      fileInput.click();S
    });

    $(document).on("click", ".delete-sample", function () {
      if (confirm("Are you sure to delete this sample?")) {
        var sample = $(this).closest(".sample");
        var id = sample.data("id");
        $.ajax({
          url: "/admin/sample/" + id,
          type: "DELETE",
          dataType: "JSON",
          success: function (result) {
            if (result.status == "success") {
              sample.remove();
            } else {
              alert(result.message);
            }
          },
        });
      }
    });

    $(document).on("click", ".sample-description", function () {
      $(this).parent().find('.sample-description-box').css({'opacity': '1', 'z-index': '1'});
    });

    $(document).on("click", ".sample-description-exit", function () {
      $(this).closest('.sample-description-box').css({'opacity': '0', 'z-index': 'unset'});
    });

    $(document).on("click", ".sample-description-edit", function () {
      let sampleItem = $(this).closest('.sample-description-box');
      sampleItem.find('.sample-description-editing').show();
      sampleItem.find('.sample-description-nonediting').hide();
      sampleItem.find('.sample-description-text').removeAttr('disabled');
    });

    $(document).on("click", ".sample-description-undo", function () {
      let sampleItem = $(this).closest('.sample-description-box');
      let sampleTextarea = sampleItem.find('.sample-description-text');
      let undoText = sampleTextarea.attr('data-undo-text');
      sampleTextarea.val(undoText);
    });

    $(document).on("click", ".sample-description-save", function () {
      let sampleItem = $(this).closest('.sample');
      let id = sampleItem.data("id");
      let sampleDescriptionBox = $(this).closest('.sample-description-box');
      let sampleTextarea = sampleDescriptionBox.find('.sample-description-text');
      let description = sampleTextarea.val().trim();
      let undoText = sampleTextarea.attr('data-undo-text').trim();

      if(description != undoText) {
        $.ajax({
          type: "PUT",
          url: "/admin/sample/" + id,
          dataType: "JSON",
          data: {
            id: id,
            description: description,
          },
          success: function (response) {
            if(response.status == 'success') {
              sampleItem.find('.sample-description-editing').hide();
              sampleItem.find('.sample-description-nonediting').show();
              sampleItem.find('.sample-description-text').prop('disabled', true);
            }
            if(response.message) {
              alert(response.message);
            }
          },
        });
      }
    });















    $(".sample-gallery").sortable({
      draggable: ".sample",
      swapThreshold: 1,
      animation: 150,
      onUpdate: function (e) {
        var list = [];
        $(".sample").each(function (i, elem) {
          list.push($(elem).data("id"));
        });
        $.ajax({
          url: "admin/sample/reorder",
          type: "POST",
          dataType: "JSON",
          data: { order: list },
          success: function () {
            console.log("success");
          },
        });
      },
    });
  }

  return {
    init: function () {
      initSample();
      initRenameEvent();
    },
  };
};

$(function () {
  var instance = new admin();
  instance.init();
});
