jQuery(document).ready(function ($) {
  $("#errormsg").hide()
  $(".card-popup").hide()
  $(".subId").hide()

  let urlParams = new URLSearchParams(window.location.search)
  let billing = urlParams.get("billing")
  if (billing) {
    urlParams.delete("billing")

    setTimeout(function () {
      $('.create-tab-bar [data-target="tab-account"]').trigger("click")
      setTimeout(function () {
        $('.account-submenus [data-target="payments"]').trigger("click")
      }, 100)
    }, 100)
  }

  let continueWith
  if ((continueWith = urlParams.get("continue_with"))) {
    // Remove Parameters
    urlParams.delete("continue_with")
    history.replaceState(null, "", "?" + urlParams + location.hash)

    // Go to the point
    continueWith = continueWith.split(":")
    if (continueWith[0] == "membership") {
      setTimeout(function () {
        $('.create-tab-bar [data-target="tab-account"]').trigger("click")
        setTimeout(function () {
          $('.account-submenus [data-target="membership"]').trigger("click")
        }, 100)
      }, 100)
    } else if (continueWith[0] == "payments") {
      setTimeout(function () {
        $('.create-tab-bar [data-target="tab-account"]').trigger("click")
        setTimeout(function () {
          $('.account-submenus [data-target="payments"]').trigger("click")
          if (continueWith[1] == "power-ups") {
            setTimeout(function () {
              $("#tab-account .payment-logs .tabs .power-ups").trigger("click")
              if (continueWith[2] == "update-payment-method") {
                setTimeout(function () {
                  $(
                    '#tab-account .payment-logs .logs .power-ups-logs .row .update-payment-method[data-current-payment-id="' +
                      continueWith[3] +
                      '"]'
                  ).trigger("click")
                }, 200)
              }
            }, 200)
          }
        }, 100)
      }, 100)
    }
  }

  // Arcade Modal Start
  $(document).on("click", ".arcade-open-modal", function () {
    let target
    const subscriptionStatus =
      $(this).attr("type") == "checkbox"
        ? $(this).data("subscription-status")
        : $(this).data("powerup-status")
    if (
      subscriptionStatus !== "" &&
      subscriptionStatus !== "active" &&
      $(this).attr("type") == "checkbox"
    ) {
      // in case of subscription payment failure
      $('#tab-account .each-power-up .switcher input[data-target-on="power-up-on"]').prop(
        "checked",
        false
      )
      $(`#${$(this).data("id")}`).trigger("click")
      return
    }
    // checkbox or other type
    if ($(this).attr("type") == "checkbox") {
      if ($(this).is(":checked")) {
        target = $(this).data("target-on")
      } else if ($(this).data("subscription-status") === "active" && !$(this).data("reactivate"))
        target = $(this).data("target-off")
      else if ($(this).data("subscription-status") === "active" && $(this).data("reactivate"))
        target = $(this).data("target-reactivate")
    } else {
      target = $(this).data("target")
    }

    // id
    if ($(this).data("id")) {
      let id = $(this).data("id")
      $("#" + target)
        .find(".target-id")
        .data("id", id)
    }

    // title
    if ($(this).data("title")) {
      let title = $(this).data("title")
      $("#" + target)
        .find(".target-title")
        .text(title)
    }

    // description
    if ($(this).data("description")) {
      let description = $(this).data("description")
      if (target !== "power-up-update" || subscriptionStatus !== "active")
        $("#" + target)
          .find(".target-description")
          .addClass("error-alert")
          .text(description)
    } else {
      if ($(this).attr("type") == "checkbox") {
        if ($(this).is(":checked")) {
          if ($(this).data("description-on")) {
            let description = $(this).data("description-on")
            $("#" + target)
              .find(".target-description")
              .text(description)
          }
        } else {
          if ($(this).data("subscription-status") === "active") {
            let description = $(this).data("description-off")
            $("#" + target)
              .find(".target-description")
              .text(description)
          } else if ($(this).data("description-reactivate")) {
            let description = $(this).data("description-reactivate")
            $("#" + target)
              .find(".target-description")
              .text(description)
          }
        }
      }
    }

    // Specifically for deactivating powerup
    if ($(this).data("current-payment")) {
      let currentPayment = $(this).data("current-payment")
      currentPayment = $.trim(currentPayment)
      if (currentPayment && currentPayment != "") {
        $("#" + target)
          .find(".target-current-payment")
          .text(currentPayment)
      }
    }
    if ($(this).data("payment-type")) {
      let paymentType = $(this).data("payment-type")
      paymentType = $.trim(paymentType)
      if (paymentType && paymentType != "") {
        $("#" + target)
          .find(".target-payment-type")
          .data("payment-type", paymentType)
      }
    }

    // Specifically for updating powerup
    if ($(this).data("current-payment-id")) {
      let currentPaymentId = $(this).data("current-payment-id")
      let currentPaymentType = $(this).data("current-payment-type")
      $("#" + target)
        .find('.target-current-payment-id[type="radio"]')
        .prop("checked", false)
      $("#" + target)
        .find('.target-current-payment-id[type="radio"][value="' + currentPaymentId + '"]')
        .prop("checked", true)
      $("#" + target)
        .find('.target-current-payment-id[type="hidden"]')
        .val(currentPaymentId)
      $("#" + target)
        .find('.target-current-payment-type[type="hidden"]')
        .val(currentPaymentType)
      $("#" + target)
        .find('.target-power-up-update[type="hidden"]')
        .val($(this).data("powerup-status"))
    }
    if ($(this).data("selected-powerup-id")) {
      let selectedPowerupId = $(this).data("selected-powerup-id")
      $("#" + target)
        .find('.target-selected-powerup-id[type="hidden"]')
        .val(selectedPowerupId)
    }

    $("#" + target).fadeIn()
  })
  window.onclick = function (event) {
    let arcadeModals = $(".arcade-modal")
    let excludes = ["power-up-on", "power-up-off", "power-up-reactivate"]
    $.each(arcadeModals, function (index, arcadeModal) {
      if (!excludes.includes($(arcadeModal).attr("id"))) {
        if (event.target == arcadeModal) {
          if ($(arcadeModal).attr("id") == "edit-stripe-card") {
            window.card.unmount()
            window.card.mount("#card-element")
          }
          $(arcadeModal).fadeOut()
        }
      }
    })
  }
  $(document).on("click", ".arcade-modal-close", function () {
    let arcadeModal = $(this).closest(".arcade-modal")
    if ($(arcadeModal).attr("id") == "edit-stripe-card") {
      window.card.unmount()
      window.card.mount("#card-element")
    } else if ($(arcadeModal).attr("id") == "power-up-on") {
      $('#tab-account .each-power-up .switcher input[data-target-on="power-up-on"]').prop(
        "checked",
        false
      )
    } else if ($(arcadeModal).attr("id") == "power-up-off") {
      $('#tab-account .each-power-up .switcher input[data-target-off="power-up-off"]').prop(
        "checked",
        true
      )
    } else if ($(arcadeModal).attr("id") == "power-up-reactivate") {
      $(
        '#tab-account .each-power-up .switcher input[data-target-reactivate="power-up-reactivate"]'
      ).prop("checked", true)
    }
    $(arcadeModal).fadeOut()
  })
  // Arcade Modal End

  $(document).on("click", ".arcade-open-modal.edit-card", function () {
    let title = $(this).data("title")
    let target = $(this).data("target")
    let id = $(this).data("id")
    let arcadeModalContent = "#" + target + " .arcade-modal-content"
    window.card.unmount()
    window.card.mount("#card-edit-element")
    $(arcadeModalContent + " .head h2 span").text(" " + title)
    $(arcadeModalContent + " .foot .payment-method-buttons .save").data("id", id)
  })

  $(document).on(
    "click",
    ".arcade-open-modal.delete-card, .arcade-open-modal.delete-paypal",
    function () {
      let id = $(this).data("id")
      let title = $(this).data("title")
      let target = $(this).data("target")
      let arcadeModalContent = "#" + target + " .arcade-modal-content"
      $(arcadeModalContent + " .head h2 span").text(" " + title)
      $(arcadeModalContent + " .foot .delete").data("id", id)
    }
  )

  $(document).on("click", "#delete-paypal .arcade-modal-content .foot .delete", function () {
    let id = $(this).data("id")
    $(this).parent().find(".arcade-modal-close").trigger("click")
    $.ajax({
      method: "DELETE",
      url: "/payment/delete-payment",
      data: { id: id },
      success: function () {
        $(
          '#tab-account .all-payments .each-payment[data-id="' + id + '"][data-type="paypal"]'
        ).remove()
        $('#power-up-on .body > div [name="power_up_payment_method"][value="' + id + '"]')
          .parent()
          .remove()
      },
      error: function (response) {
        if (response.status == 400) {
          $("#delete-payment-prevention .show-connected-powerups").data("payment-id", id)
          $("#delete-payment-prevention").fadeIn()
        }
        console.log(response)
      },
    })
  })

  $(document).on("click", "#delete-stripe-card .arcade-modal-content .foot .delete", function () {
    let id = $(this).data("id")
    $(this).parent().find(".arcade-modal-close").trigger("click")
    $.ajax({
      method: "DELETE",
      url: "/payment/delete-payment",
      data: { id: id },
      success: function () {
        $(
          '#tab-account .all-payments .each-payment[data-id="' + id + '"][data-type="card"]'
        ).remove()
        $('#power-up-on .body > div [name="power_up_payment_method"][value="' + id + '"]')
          .parent()
          .remove()
      },
      error: function (response) {
        if (response.status == 400) {
          $("#delete-payment-prevention .show-connected-powerups").data("payment-id", id)
          $("#delete-payment-prevention").fadeIn()
        }
        console.log(response)
      },
    })
  })

  $(document).on("click", "#delete-payment-prevention .show-connected-powerups", function () {
    $("#tab-account .payment-logs .power-ups-logs .row").removeClass("red")
    $(this).closest(".arcade-modal").fadeOut()
    $("#tab-account .payment-logs .tabs .power-ups").trigger("click")

    let paymentId = $(this).data("payment-id")
    const row = $(
      '#tab-account .payment-logs .power-ups-logs .row .update-payment-method[data-current-payment-id="' +
        paymentId +
        '"]'
    ).parent()
    row.addClass("red")
    $("html, body").animate(
      {
        scrollTop: row.offset().top,
      },
      0
    )
  })

  $(document).on("click", "#tab-account .all-payments .view-transaction-history", function () {
    let id = $(this).closest(".each-payment").data("id")
    $.ajax({
      method: "GET",
      url: "/payment/view-transaction",
      data: { id: id },
      success: function (response) {
        let transactions = ""
        if (response && response.transactions.length) {
          $.each(response.transactions, function (index, transaction) {
            transactions += `<div class="row">
                <div class="col">${transaction.date}</div>
                <div class="col">${transaction.title}</div>
                <div class="col">${transaction.paymentTitle}</div>
                <div class="col">${transaction.minusPlus}$${transaction.cost}</div>
              </div>`
          })
        } else {
          transactions = `<div class="row">
              <div class="col">No transaction history</div>
            </div>`
        }
        const paymentLogs = $(".account-content-payments .payment-logs")
        paymentLogs.find(" .logs .transaction-history-logs").html(transactions)
        const transactionHistory = paymentLogs.find(" .tabs > .transaction-history")
        transactionHistory.addClass("active")
        paymentLogs.find(" .tabs > .power-ups").removeClass("active")

        const tabClass = transactionHistory.attr("class").split(" ")[0]
        const logsClass = "." + tabClass + "-logs"
        const logsEl = transactionHistory.closest(".payment-logs").find(".logs")
        logsEl.find("> div").hide()
        logsEl.find(logsClass).fadeIn()
      },
      error: function (response) {
        console.log(response)
      },
    })
  })

  $(document).on("click", ".account-submenus .tab-sub-item", function () {
    let target = $(this).data("target")
    let targetEl = $("#tab-account .account-content-" + target)
    if (targetEl.length) {
      $(this).parent().find(".tab-sub-item").removeClass("active")
      $(this).addClass("active")
      $('#tab-account [class*="account-content-').hide()
      targetEl.show()
    }
  })

  $(document).on("click", ".account-content-payments .each-payment .add-payment-box", function () {
    $(this).removeClass("red")
    $(this).hide()
    $(this).parent().find(".payment-method-buttons").show()
    $(".payment-method-buttons .card").trigger("click")
  })

  $(document).on("click", ".payment-method-buttons .card", function () {
    $(this).css("width", "100%")
    $(this).parent().find(".paypal").hide()
    $(".card-details").show()
  })

  $(document).on("click", ".payment-box .card-popup .delete-payment-card", function () {
    var rem = $(this).closest(".payment-box")
    let id = $(this).data("id")
    $(this).closest(".payment-box").find(".card-opt").trigger("click")
    $.ajax({
      method: "DELETE",
      url: "/payment/delete-payment",
      data: { id: id },
      success: function () {
        rem.remove()
      },
      error: function (response) {
        console.log(response)
      },
    })
  })

  $(document).on("click", ".payment-box .card-popup .make-default-card", function () {
    var paymentableId = $(this).data("id")
    var pid = $(this).data("data-pid")
    var subscriptionId = $(this).siblings(".subId").text()

    $.ajax({
      method: "POST",
      url: "/payment/update-subscription-payment-method",
      data: { pid, id: paymentableId, subId: subscriptionId },
      success: function () {
        // setTimeout(() => {
        //   console.log("redirect")
        //   $("#account").trigger("click")
        //   $(".account-submenus").children("tab-sub-item:nth-child(3)").trigger("click")
        // }, 15000)

        // window.location.hash = "?billing"
        history.replaceState(null, "", "?" + "billing=true")
        window.location.reload()

        // window.location.reload()
      },
      error: function (response) {
        console.log("error", response)
        window.location.reload()
      },
    })
  })

  $(".card-opt").on("click", function () {
    var popup = $(this).siblings(".card-popup")
    if (popup.is(":visible")) {
      // $(".card-content").css({ "margin-bottom": "20px" })
      popup.hide()
    } else {
      // $(".card-content").css({ "margin-bottom": "56px" })
      popup.show()
    }
  })

  $(document).on("click", ".payment-method-buttons .paypal", function () {
    $(this).css("width", "100%")
    $(this).parent().find(".card").hide()
    $(".paypal-details").show()
  })

  $(document).on("click", ".paypal-attention .question-icon > span", function () {
    $(this).parent().find("div").fadeToggle()
  })

  $(document).on("click", function () {
    if (event) {
      let clickedEl = $(".paypal-attention .question-icon")
      if (!clickedEl.is(event.target) && clickedEl.has(event.target).length === 0) {
        $(".paypal-attention .question-icon > div").fadeOut()
      }
    }
  })

  $(document).on("click", ".each-payment .payment-method-buttons .cancel", function () {
    let eachPayment = $(this).closest(".each-payment")
    eachPayment.find(".payment-method-buttons").hide()
    eachPayment.find(".payment-method-buttons .card").css("width", "calc(50% - 2px)")
    eachPayment.find(".payment-method-buttons .paypal").show()
    eachPayment.find(".card-details").hide()
    eachPayment.find(".add-payment-box").show()
  })

  $(document).on("click", ".paypal-details .authorize-on-paypal", function () {
    $(this).attr("disabled", "disabled")
    $(this).find(".text").hide()
    $(this).find(".spinner").css("display", "flex")
    let parent = $(this).parent()
    let paypalNickname = $.trim(parent.find('[name="paypal_nickname"]').val())
    let continueWith = parent.closest(".each-payment").find('[name="continue_with"]').val()
    if (continueWith == "") {
      continueWith = "payments"
    }
    $.ajax({
      method: "POST",
      url: "/payment/authorize-paypal",
      data: {
        paypal_nickname: paypalNickname,
        continue_with: continueWith,
      },
      success: function (approvalUrl) {
        location.href = approvalUrl
      },
      error: function (response) {
        console.log(response)
      },
    })
  })

  $(document).on("click", ".paypal-details .cancel", function () {
    let eachPayment = $(this).closest(".each-payment")
    eachPayment.find(".payment-method-buttons").hide()
    eachPayment.find(".payment-method-buttons .paypal").css("width", "calc(50% - 2px)")
    eachPayment.find(".payment-method-buttons .card").show()
    eachPayment.find(".paypal-details").hide()
    eachPayment.find(this).closest(".each-payment").find(".add-payment-box").show()
  })

  $(document).on("click", ".account-content-payments .each-payment .menu-icon", function (e) {
    e.stopPropagation()

    let menuItems = $(this).closest(".menu-items-wrap").find(".menu-items")
    if ($(this).hasClass("menu-open")) {
      menuItems.fadeOut()
      $(this).removeClass("menu-open")
      $(this).closest(".added-payment-box").removeClass("menu-open")
    } else {
      menuItems.fadeIn()
      $(this).addClass("menu-open")
      $(this).closest(".added-payment-box").addClass("menu-open")
    }
  })

  $(document).on("click", ".account-content-payments .payment-logs .tabs > div", function () {
    let $this = $(this)
    if ($this.hasClass("transaction-history")) {
      $.ajax({
        method: "GET",
        url: "/payment/view-transaction",
        data: { id: 0 },
        success: function (response) {
          $this.parent().find("div").removeClass("active")
          $this.addClass("active")

          let tabClass = $this.attr("class").split(" ")[0]
          let logsClass = "." + tabClass + "-logs"
          let logsEl = $this.closest(".payment-logs").find(".logs")
          logsEl.find("> div").hide()
          logsEl.find(logsClass).fadeIn()

          let transactions = ""
          if (response && response.transactions.length) {
            $.each(response.transactions, function (index, transaction) {
              transactions += `<div class="row">
                  <div class="col">${transaction.date}</div>
                  <div class="col">${transaction.title}</div>
                  <div class="col">${transaction.paymentTitle}</div>
                  <div class="col">${transaction.minusPlus}$${transaction.cost}</div>
                </div>`
            })
          } else {
            transactions = `<div class="row">
                <div class="col">No transaction history</div>
              </div>`
          }
          let paymentLogs = $(".account-content-payments .payment-logs")
          paymentLogs.find(" .logs .transaction-history-logs").html(transactions)
        },
        error: function (response) {
          console.log(response)
        },
      })
    } else {
      $this.parent().find("div").removeClass("active")
      $this.addClass("active")

      let tabClass = $this.attr("class").split(" ")[0]
      let logsClass = "." + tabClass + "-logs"
      let logsEl = $this.closest(".payment-logs").find(".logs")
      logsEl.find("> div").hide()
      logsEl.find(logsClass).fadeIn()
    }
  })

  $(document).on(
    "click",
    ".account-content-payments .power-ups-logs .row.no-power-up .col button",
    function () {
      $('.account-submenus .tab-sub-item[data-target="power-ups"]').trigger("click")
    }
  )

  // Pro Membership
  $(document).on("click", ".div-upgrade-now-btn", function () {
    $(this).hide()
    $(".promo-fields").hide()
    //$('.pro-prices-line').hide();
    if ($(".div-saved-cards-btn").html()) {
      $(".div-upgrade-btn-options").css("display", "flex")
    } else {
      $(".div-new-card-btn").trigger("click")
    }
  })

  $(document).on("click", ".div-saved-cards-btn", function () {
    $(".div-upgrade-btn-options").hide()
    $(".pro-upgrade-now-form").css("display", "flex")
    // get stripe code and intialize
    $(".pro-fields").hide()
    // $(".pro-save-cards-list div:first-child .single-card-entry input").prop("checked", true)
    $(".pro-save-cards-list").show()
    // $('#promoId').show();
    $(".promo-fields").hide()
  })

  $(document).on("click", ".div-new-card-btn", function () {
    $(".pro-fields").css("display", "flex")
    $(".div-upgrade-btn-options").hide()
    $(".pro-upgrade-now-form").css("display", "flex")
    // get stripe code and intialize
    $(".pro-save-cards-list").hide()
    // $('#promoId').show();
    $(".promo-fields").hide()
  })

  $(document).on("click", ".radio-block", function () {
    $(".radio-block").removeClass("checked")
    $(this).addClass("checked")
  })

  $(document).on("click", ".div-continue-arrow", function () {
    synchronizeOffHTML()
  })

  function synchronizeOffHTML() {
    let planId = $(".radio-block.checked").attr("data-value")
    let planType = planId == "2" ? "lifetime" : "monthly"
    let priceee = $(`#pro-price-${planId}`).text()
    if (priceee == "FREE") {
      priceee = "$0.0"
    }
    let planName = " Pro Membership"
    var today = new Date()
    var dd = today.getDate()
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    var mm = today.getMonth() + 1
    if (mm > 11) {
      mm = mm % 12
    }
    let detail1 = "You are about to upgrade your account to Pro!"
    let detail2 = `You will be billed ${priceee} monthly. Renews ${dd} ${monthNames[mm]}`
    let detail3 = "Cancel anytime"
    if (planId == 2) {
      // lifetime texts update here
      planName = " Pro Lifetime Member"
      detail1 = "You are about to upgrade your account to a lifetime of Pro!"
      detail2 = "This will include all Pro feature upgrades as well. Enjoy!"
      detail3 = ""
    }
    $(".finalize-price").text(` ${priceee == "$0.0" ? "Free" : priceee}`)
    $(".finalize-plan-name").text(planName)
    $(".detail-1").text(detail1)
    $(".detail-2").text(detail2)
    $(".detail-3").text(detail3)
    setTimeout(function () {
      $(".pro-prices-line").hide()
    }, 800)
  }

  $(document).on("click", ".div-promo-apply-button", function () {
    applyCouponCode().then()
  })

  $(document).on("click", ".finalise-pro-purchase-submit-btn", function () {
    let subId = $(this).data("id")
    let paymentId = $("input[name='saved_cards']:checked").val()
    if (paymentId) {
      upgradeToProMembership(paymentId, subId)
    }
  })

  $(document).on("click", ".finalise-pro-purchase-cancel-btn", function () {
    $(".finalise-pro-purchase").hide()
    $(".pro-upgrade-now-form").show()
    $(".pro-prices-line").show()
  })

  $(document).on("click", ".pro-upgrade-btn", function () {
    $(".pro-prices-line").hide()
    $(".finalise-pro-purchase").show()
    $(".pro-upgrade-now-form").hide()
    synchronizeOffHTML()
  })

  $(document).on("click", ".cancel-member-link", function () {
    $(".cancel-membership-popup ").show()
  })

  $(document).on("click", ".confirm-nevermind", function () {
    $(".cancel-membership-popup ").hide()
  })

  $(document).on("click", ".confirm-cancel", function () {
    $.ajax({
      async: false,
      method: "POST",
      url: "/payment/stripe-powerup-subscription-update",
      data: {},
      success: function (response) {
        window.location.reload()
      },
      error: function (response) {
        alert("some unexpected error occured!")
      },
    })
  })

  async function upgradeToProMembership(paymentId, subId) {
    let planId = $(".radio-block.checked").attr("data-value")
    let planType = planId == "2" ? "lifetime" : "monthly"
    let code = $("#promocodeapplied").val()

    if (paymentId && planType) {
      $.ajax({
        async: false,
        method: "POST",
        url: "/payment/upgrade-to-pro-membership",
        data: { paymentId, planType, code, subId },
        success: function (response) {
          window.location.reload()
        },
        error: function (response) {
          alert("some unexpected error occured!")
        },
      })

      // $(".membership-row-wrapper").hide()
      // $(".already-membership-row-wrapper").show()
    }
  }
  const delay = (ms) => new Promise((res) => setTimeout(res, ms))
  async function applyCouponCode() {
    let code = $("#promo_code").val()
    $(".div-promo-code.invalid").hide()
    $(".div-promo-apply-button .check-mark").hide()
    let planId = $(".radio-block.checked").attr("data-value")
    let planType = planId == "2" ? "lifetime" : "monthly"
    if (code && planId) {
      $.ajax({
        async: false,
        method: "POST",
        url: "/payment/coupon",
        data: { planType, code },
        success: async function (response) {
          if (response && response.valid) {
            let off = response.off
            // let currentPrice = $(`#pro-price-${planId}`).text()
            let currentPrice = planId == "2" ? 2900 : 29
            let updatedPrice = currentPrice
            if (response.offType == "percent") {
              // deal percent here
              updatedPrice = parseInt(currentPrice) - (parseInt(currentPrice) / 100) * parseInt(off)
            } else {
              // fixed here
              updatedPrice = parseInt(currentPrice) - parseInt(off)
            }
            if (updatedPrice < 0.5) {
              $(`#pro-price-${planId}`).text(`FREE`)
            } else {
              updatedPrice = parseFloat(updatedPrice).toFixed(2)
              $(`#pro-price-${planId}`).text(`$${updatedPrice}`)
            }
            $(".div-promo-code.verified").show()
            $(".div-promo-apply-button .check-mark").show()
            $(".div-promo-apply-button .apply-text").hide()
            $("#promocodeapplied").val($("#promo_code").val())
            $("#promo_code").val("")
            $("#promoId").hide()
            await delay(1000)
            $(".div-upgrade-now-btn").trigger("click")
            $(".div-saved-cards-btn").trigger("click")
            $(".pro-upgrade-btn").trigger("click")
          } else {
            $(".div-promo-code.invalid").show()
            setTimeout(function () {
              $(".div-promo-code.invalid").fadeOut(300)
            }, 2000)
          }
        },
        error: function (response) {
          console.log("applyCouponCode -- error", response)
          alert("some unexpected error occured!")
        },
      })
    }
  }

  $(document).on("click", "#promoId", function () {
    $(this).hide()
    $(".pro-fields").hide()
    $(".pro-save-cards-list").hide()
    $(".promo-fields").css("display", "flex")
  })

  $(document).on("click", "#cancelPromoId", function () {
    // $('.div-upgrade-btn-options').css('display', 'flex');
    $(".div-upgrade-now-btn").show()
    $(".div-upgrade-btn-options").hide()

    // price reset
    $(`#pro-price-1`).text(`$29`)
    $(`#pro-price-2`).text(`$2900`)

    $(".pro-upgrade-now-form").hide()
    $(".pro-fields").hide()
    $(".pro-save-cards-list").hide()
    $(".div-promo-apply-button .check-mark").hide()
    $(".div-promo-apply-button .apply-text").show()
    $("#promoId").show()
    $(".pro-prices-line").show()
  })

  // Power Ups
  $(document).on("click", "#power-up-on .body .add-payment-method", function () {
    $('#tab-account .each-power-up .switcher input[data-target-on="power-up-on"]').prop(
      "checked",
      false
    )
    let modal = $(this).closest(".arcade-modal")
    modal.fadeOut()
    $('.account-submenus .tab-sub-item[data-target="payments"]').trigger("click")
    $("#tab-account .all-payments .add-payment-box").addClass("red")

    let targetTitle = modal.find(".target-title")
    let title = targetTitle.text()
    if (!title) {
      title = targetTitle.val()
    }
    if (title) {
      let slug = convertToSlug(title)
      slug = "power_ups:" + slug
      $('#tab-account .all-payments [name="continue_with"]').val(slug)
    }
  })

  $(document).on("click", "#power-up-update .body .add-payment-method", function () {
    let modal = $(this).closest(".arcade-modal")
    modal.fadeOut()
    $('.account-submenus .tab-sub-item[data-target="payments"]').trigger("click")
    $("#tab-account .all-payments .add-payment-box").addClass("red")

    let targetTitle = modal.find(".target-title")
    let title = targetTitle.text()
    if (!title) {
      title = targetTitle.val()
    }
    if (title) {
      let slug = convertToSlug(title)
      slug = "payments:" + slug
      $('#tab-account .all-payments [name="continue_with"]').val(slug)
    }
  })

  $(document).on(
    "click",
    "#power-up-on .foot .get-power-up, #power-up-update .foot .update-power-up",
    function (e) {
      e.preventDefault()
      let dis = $(this)
      let toUpdate = dis.hasClass("update-power-up")
      let powerupId = dis.data("id")
      let modal = dis.closest(".arcade-modal")
      let body = modal.find(".body")
      let selectedPayment = $(body).find('[name="power_up_payment_method"]:checked')
      let paymentId = selectedPayment.val()
      let paymentType = selectedPayment.data("type")
      let currentPaymentId = modal.find('.target-current-payment-id[type="hidden"]').val()
      let currentPaymentType = modal.find('.target-current-payment-type[type="hidden"]').val()
      let selectedPowerupId

      if (parseInt(paymentId) > 0) {
        dis.attr("disabled", "disabled")
        dis.find(".text").hide()
        dis.find(".spinner").css({ display: "inline-block", width: "12px", height: "12px" })
      }

      let requestTo
      if (toUpdate) {
        if (currentPaymentType == "card") {
          requestTo = "stripe-update-powerup-payment-method"
        } else if (currentPaymentType == "paypal") {
          requestTo = "cancel-powerup-by-paypal"
        }

        powerupId = modal.find(".target-selected-powerup-id").val()
        // Same selected method can't be processed, either disable btn via css or here
        // uncomment if FE handling is added
        /* if(paymentId === currentPaymentId)
      return; */
        const close = function (
          done,
          errorMsg = "Something went wrong. Please try again later or contact support"
        ) {
          if (!done) {
            dis.find(".spinner").css("display", "none")
            dis.find(".text").show()
            dis.prop("disabled", false)
            $("#errormsg").show()
            $("#errormsg").text(errorMsg)
            return
          }
          $("#tab-account .each-power-up .switcher span").removeClass("danger-class")
          $('#tab-account .each-power-up .switcher input[data-target-on="power-up-on"]').prop(
            "checked",
            true
          )
          $('#tab-account .each-power-up .switcher input[data-target-on="power-up-on"]').data(
            "subscription-status",
            "active"
          )
          $('#tab-account .each-power-up .switcher input[data-target-on="power-up-update"]').data(
            "description",
            ""
          )
          $(body).find(" > div").first().hide()
          $(body).find(" > .success-icon").fadeIn()
          setTimeout(function () {
            $(modal).fadeOut()
            dis.prop("disabled", false)
            dis.find(".text").show()
            dis.find(".spinner").css("display", "none")
            setTimeout(function () {
              $(body).find(" > div").first().show()
              $(body).find(" > .success-icon").hide()
            }, 300)
          }, 700)
          $("#errormsg").hide()
        }
        $.ajax({
          async: false,
          method: "POST",
          url: "/payment/" + requestTo,
          data: { powerupId: powerupId, paymentId },
          success: function (response) {
            // response = await response.json();
            if (response.transaction) {
              let transaction = response.transaction
              const transactionDiv =
                '<div class="row">' +
                '<div class="col">' +
                transaction.date +
                "</div>" +
                '<div class="col">' +
                transaction.title +
                "</div>" +
                '<div class="col">' +
                transaction.paymentTitle +
                "</div>" +
                '<div class="col">' +
                transaction.minusPlus +
                "$" +
                transaction.cost +
                "</div>" +
                "</div>"
              $(
                "#tab-account .payment-logs .logs .transaction-history-logs .no-transaction"
              ).remove()
              $("#tab-account .payment-logs .logs .transaction-history-logs").append(transactionDiv)
            }

            let userPowerup = response.userPowerup
            userPowerupEl =
              '<div class="row">' +
              '<div class="col power-up-title">' +
              userPowerup.powerup.title +
              "</div>" +
              '<div class="col">' +
              userPowerup.payment.title +
              "</div>" +
              '<div class="col">Renews ' +
              userPowerup.expireDate +
              "</div>" +
              '<div class="col update-payment-method arcade-open-modal"' +
              ' data-id="' +
              paymentId +
              '"' +
              ' id="' +
              powerupId +
              '"' +
              ' data-target="power-up-update"' +
              ' data-description="Replace This Failure Description - From Success"' +
              ' data-title="' +
              userPowerup.powerup.title +
              '"' +
              ' data-selected-powerup-id="' +
              userPowerup.powerup.id +
              '"' +
              ' data-current-payment-type="' +
              userPowerup.payment.paymentableType +
              '"' +
              ' data-powerup-status="' +
              userPowerup.subscriptionStatus +
              '"' +
              ' data-current-payment-id="' +
              userPowerup.payment.id +
              '">' +
              "Update Payment Method" +
              "</div>" +
              "</div>"
            $("#tab-account .payment-logs .logs .power-ups-logs .no-power-up").remove()
            if (toUpdate) {
              $(
                '#tab-account .payment-logs .logs .power-ups-logs .row .update-payment-method[data-current-payment-id="' +
                  currentPaymentId +
                  '"][data-selected-powerup-id="' +
                  powerupId +
                  '"]'
              )
                .parent()
                .remove()
            }
            $("#tab-account .payment-logs .logs .power-ups-logs").append(userPowerupEl)

            powerupSwitcher = $("#" + convertToSlug(userPowerup.powerup.title)).find(
              '.switcher .arcade-switch [type="checkbox"]'
            )
            powerupSwitcher.data({
              "current-payment": userPowerup.payment.title,
              "payment-type": userPowerup.payment.paymentableType,
            })
            $("#power-up-off .target-current-payment").text(userPowerup.powerup.title)
            close(true)
          },
          error: function (response) {
            // only called in case of "Payment Intent failed" so that users can see that payment method/attempt has failed
            if (response.responseJSON.error.message === "Invoice Failed") {
              close(false, response.responseJSON.error.mes)
            } else close(true)
          },
        })
      } else {
        if (paymentType == "card") {
          requestTo = "powerup-by-stripe"
        } else if (paymentType == "paypal") {
          requestTo = "powerup-by-paypal"
        }

        var code = $(".coupon-code").val()
        let dataToSend = { powerupId: powerupId, paymentId: paymentId, code }

        const setPowerUp = function (userPowerup) {
          let userPowerupEl =
            '<div class="row">' +
            '<div class="col power-up-title">' +
            userPowerup.powerup.title +
            "</div>" +
            '<div class="col">' +
            userPowerup.payment.title +
            "</div>" +
            '<div class="col">Renews ' +
            userPowerup.expireDate +
            "</div>" +
            '<div class="col update-payment-method arcade-open-modal error"' +
            ' data-id="' +
            paymentId +
            '"' +
            ' id="' +
            powerupId +
            '"' +
            ' data-target="power-up-update"' +
            ' data-description="Your subscription is ' +
            userPowerup.subscriptionStatus +
            '"' +
            ' data-title="' +
            userPowerup.powerup.title +
            '"' +
            ' data-selected-powerup-id="' +
            userPowerup.powerup.id +
            '"' +
            ' data-current-payment-type="' +
            userPowerup.payment.paymentableType +
            '"' +
            ' data-powerup-status="' +
            userPowerup.subscriptionStatus +
            '"' +
            ' data-current-payment-id="' +
            userPowerup.payment.id +
            '">' +
            "Update Payment Method" +
            `                    ${
              !!userPowerup &&
              userPowerup.subscriptionStatus !== "active" &&
              "<span class='danger-class'></span>"
            }` +
            "</div>" +
            "</div>"
          $("#tab-account .payment-logs .logs .power-ups-logs .no-power-up").remove()
          if (toUpdate) {
            $(
              '#tab-account .payment-logs .logs .power-ups-logs .row .update-payment-method[data-current-payment-id="' +
                currentPaymentId +
                '"][data-selected-powerup-id="' +
                powerupId +
                '"]'
            )
              .parent()
              .remove()
          }
          $("#tab-account .payment-logs .logs .power-ups-logs").append(userPowerupEl)

          $("input.arcade-open-modal").data("id", userPowerup.powerup.id)
          $("input.arcade-open-modal").data("subscription-status", userPowerup.subscriptionStatus)
          $("input.arcade-open-modal").data(
            "description-off",
            'Are you sure you want to cancel your "' +
              userPowerup.powerup.title +
              '" power up? If you cancel now, you will still have access to your Power-up until ' +
              userPowerup.expireDate +
              "."
          )
          let powerupSwitcher = $("#" + convertToSlug(userPowerup.powerup.title)).find(
            '.switcher .arcade-switch [type="checkbox"]'
          )
          powerupSwitcher.data({
            "current-payment": userPowerup.payment.title,
            "payment-type": userPowerup.payment.paymentableType,
          })
          $("#power-up-off .target-current-payment").text(userPowerup.powerup.title)
        }
        const close = function (done) {
          if (!done) {
            dis.find(".spinner").css("display", "none")
            dis.find(".text").show()
            dis.find(".text").prop("disabled", true)
            // dis.prop('disabled', false);
            $("#power-up-on").find(".arcade-modal-close").text("Close")
            return
          }
          $(body).find(" > div").first().hide()
          $(body).find(" > .success-icon").fadeIn()
          setTimeout(function () {
            $(modal).fadeOut()
            dis.prop("disabled", false)
            dis.find(".text").show()
            dis.find(".spinner").css("display", "none")
            setTimeout(function () {
              $(body).find(" > div").first().show()
              $(body).find(" > .success-icon").hide()
            }, 300)
          }, 700)
        }
        $.ajax({
          method: "POST",
          url: "/payment/" + requestTo,
          data: dataToSend,
          success: function (response) {
            if (response.transaction) {
              let transaction = response.transaction
              transaction =
                '<div class="row">' +
                '<div class="col">' +
                transaction.date +
                "</div>" +
                '<div class="col">' +
                transaction.title +
                "</div>" +
                '<div class="col">' +
                transaction.paymentTitle +
                "</div>" +
                '<div class="col">' +
                transaction.minusPlus +
                "$" +
                transaction.cost +
                "</div>" +
                "</div>"
              $(
                "#tab-account .payment-logs .logs .transaction-history-logs .no-transaction"
              ).remove()
              $("#tab-account .payment-logs .logs .transaction-history-logs").append(transaction)
            }

            setPowerUp(response.userPowerup)
            close(true)
          },
          error: function (response) {
            // only called in case of "Payment Intent failed" so that users can see that payment method/attempt has failed
            if (response.responseJSON.error.message === "Payment Intent failed") {
              setPowerUp(response.responseJSON.userPowerup)
              close(false)
              $("#power-up-on")
                .find(".target-description")
                .addClass("error-alert")
                .text(
                  "Payment Failed, Please refresh to check the response otherwise you can Update payment method"
                )
            }
          },
        })
      }
    }
  )

  const updateSubscription = function () {
    $(this).attr("disabled", "disabled")
    $(this).find(".text").hide()
    $(this).find(".spinner").css({ display: "inline-block", width: "12px", height: "12px" })
    const paymentType = $(this)
      .closest(".arcade-modal-content")
      .find(".target-payment-type")
      .data("payment-type")

    const el = $(this)
    let powerupId = $(this).data("id")
    let modal = $(this).closest(".arcade-modal")
    let body = modal.find(".body")

    let requestTo
    if (paymentType == "card") {
      requestTo = "stripe-powerup-subscription-update"
    } else if (paymentType == "paypal") {
      requestTo = "cancel-powerup-by-paypal"
    }

    $.ajax({
      method: "POST",
      url: "/payment/" + requestTo,
      data: { powerupId: powerupId },
      success: function (response) {
        $(body).find(" > div").first().hide()
        $(body).find(" > .success-icon").fadeIn()
        setTimeout(function () {
          $(body).find(" > div").first().show()
          $(body).find(" > .success-icon").hide()
          el.removeAttr("disabled")
          el.find(".text").show()
          el.find(".spinner").hide()
          setTimeout(() => {
            el.parent().find(".arcade-modal-close").trigger("click")
            const col = $(
              "#tab-account > div.account-content-payments > div.payment-logs > div.logs > div.power-ups-logs > div > div:nth-child(3)"
            )
            const colTexts = col.text().split(" ")
            if (response.cancelled) {
              $("input.arcade-open-modal").data("reactivate", "reactivate")
              col.text("Ends " + colTexts[1])
            } else {
              $("input.arcade-open-modal").data("reactivate", null)
              col.text("Renews " + colTexts[1])
            }
          }, 800)
        }, 700)
      },
      error: function (response) {
        console.log(response)
      },
    })
  }
  $(document).on("click", "#power-up-reactivate .foot .reactive-power-up", updateSubscription)
  $(document).on("click", "#power-up-off .foot .cancel-power-up", updateSubscription)
})

function convertToSlug(string) {
  return string
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
}

var create = function () {
  var portfolios = []
  var portfolioGallerySize = 0
  var proPopup = new popup(".popup-wrapper")
  proPopup.onButton(function () {
    showTab($(".tab-item[data-target=tab-account]"))
    $(".pro-price").toggle()
    $(".payment-panel").toggle()
  })

  function showTab(element) {
    var id = element.data("target")
    if (id) {
      $(".tab-item:not(.portal-item)").removeClass("active")
      $(".tab-content").removeClass("open")
      element.addClass("active")
      $("#" + id).addClass("open")

      let accountSubmenus = $('.tab-sub-item[data-submenu="account"]')
      id == "tab-account" ? accountSubmenus.show() : accountSubmenus.hide()
    }
  }

  function initTab() {
    $(".tab-item").click(function () {
      showTab($(this))
      $(document).trigger("top-menu-change")
    })
  }

  function initRenameEvent() {
    $(document).on("dblclick", ".editable-object", function () {
      $(this).attr("spellcheck", "false")
      $(this).attr("contenteditable", "true")
      $(this).focus()
      document.execCommand("selectAll", false, null)
    })

    $(document).on("keydown", ".editable-object", function (e) {
      e.stopPropagation()
      if (e.keyCode == 13) {
        e.preventDefault()
        $(this).attr("contenteditable", "false")
      }
    })

    $(document).on("blur", ".editable-object", function (e) {
      $(this).attr("contenteditable", "false")
    })

    $(document).on("blur", "div.portfolio-title", function (e) {
      var item = $(this).closest(".portfolio-item")
      var id = item.data("id")
      var title = $(this).text().trim()

      $.ajax({
        type: "POST",
        url: "/publish/portfolio/rename",
        dataType: "JSON",
        data: {
          id: id,
          title: title,
        },
        success: function (response) {
          if (response.message) {
            alert(response.message)
          }
        },
      })
    })

    $(document).on("blur", "div.project-name", function (e) {
      var item = $(this).closest(".project-item")
      var id = item.data("project-id")
      var title = $(this).text().trim()

      fetch("/asset/project/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          data: {
            name: title,
          },
        }),
      }).catch((error) => {
        console.error("Error:", error)
      })
    })

    $(document).on("blur", ".account-details", function (e) {
      var property = $(this).data("property")
      var value = $(this).text().trim()

      if (
        (property == "profile.username" && value == "") ||
        (property == "profile.username" && value == "Enter Username...")
      ) {
        $(this).text("Enter Username...")
        $(document)
          .trigger("click")
          .on("focus", ".editable-object", function (e) {
            $(this).attr("contenteditable", "true")
          })
        alert("Username Can't be empty")
        return
      }

      var data = {}
      data[property] = value

      $.ajax({
        type: "POST",
        url: "/account/profile",
        dataType: "JSON",
        data,
        success: function (res) {
          if (res.status == "error") {
            alert(res.msg)
          }
        },
      })
    })
  }

  function addPortfolioItem(portfolio) {
    var gallery = $("#tab-portfolio .portfolio-gallery")
    var item = $(
      `<div class="portfolio-item${portfolio ? " sortable" : ""}${
        portfolio && portfolio.thumbUrl ? " no-border" : ""
      }"></div>`
    )
    var thumbnailImage =
      "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/website/master/item-side-menu-options/change-image.svg"
    var launchImage =
      "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/website/master/item-side-menu-options/published-project.svg"
    var descriptionImage =
      "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/website/master/item-side-menu-options/project-details-btn.svg"
    var shareImage =
      "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/website/master/item-side-menu-options/social-share-dots.svg"
    var deleteImage =
      "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/website/master/item-side-menu-options/x-remove-portfolio-publish.svg"

    if (portfolio) {
      item.data("id", portfolio.id)
      item.data("slug", portfolio.slug)
      item.append(
        portfolio.thumbUrl
          ? $(`<img class="portfolio-image" src="${portfolio.thumbUrl}"></img>`)
          : $('<div class="questionmark"></div>')
      )
      item.append(
        $(
          `<div class="portfolio-title editable-object">${
            portfolio.title ? portfolio.title : "Untitled"
          }</div>`
        )
      )
      item.append(
        $(
          `<div class="portfolio-description">
            <textarea spellcheck="true" class="portfolio-description-text" disabled maxlength="750" placeholder="Your description here..." data-undo-text="${
              portfolio.description ?? ""
            }">${portfolio.description ?? ""}</textarea>
            <div class="portfolio-description-nonediting">
              <div class="portfolio-description-edit">Edit</div><div class="portfolio-description-exit">Exit</div>
            </div>
            <div class="portfolio-description-editing" style="display:none">
              <div class="portfolio-description-undo">Undo</div><div class="portfolio-description-save">Save</div>
            </div>
          </div>`
        )
      )
      var editProfileMenu = $('<div class="portfolio-edit-menu"></div>')
      editProfileMenu.append(
        $(`<div class="portfolio-thumbnail-button">
            <img src="${thumbnailImage}" width="25" height="25">
          </div>`)
      )
      editProfileMenu.append(
        $(`<div class="portfolio-description-button">
            <img src="${descriptionImage}" width="25" height="25">
          </div>`)
      )
      editProfileMenu.append(
        $(`<div class="portfolio-launch-button">
            <img src="${launchImage}" width="25" height="25">
          </div>`)
      )

      var share1 = $(`<div class="portfolio-share-button">
          <img src="${shareImage}" width="25" height="25">
        </div>`)
      share1.attr("data-slug", "/" + portfolio.slug)
      share1.attr("data-thumbUrl", portfolio.thumbUrl)
      share1.attr("data-thumbnail", portfolio.thumbnail)
      share1.attr("data-title", portfolio.title)
      share1.attr("data-author", portfolio.author)
      share1.attr("data-description", portfolio.description)

      editProfileMenu.append(share1)
      editProfileMenu.append(
        $(
          `<div class="portfolio-delete-button">
            <img src="${deleteImage}" width="25" height="25">
          </div>`
        )
      )
      item.append(editProfileMenu)
    } else {
      item.append($('<div class="questionmark"></div>'))
    }

    if (portfolio) {
      if (portfolios.length == portfolioGallerySize) {
        portfolioGallerySize++
        gallery.append(item)
      } else {
        var toUpdate = $(".portfolio-item")[portfolios.length]
        $(toUpdate).replaceWith(item)
      }
      portfolios.push(portfolio)
    } else {
      portfolioGallerySize++
      gallery.append(item)
    }
  }

  function removePortfolioItem(portfolio) {
    var index = portfolio.index()
    portfolios.splice(index, 1)
    portfolio.remove()
    portfolioGallerySize--

    if (portfolioGallerySize == 5) {
      addPortfolioItem()
    }
  }

  function resizeProjectDomainList() {
    var portfolioItem = $(".portfolio-item")[0]
    if (portfolioItem) {
      var width = $(".portfolio-item")[0].offsetWidth
      $(".project-slug-list").width(width)
    }
  }

  function loadPortfolio() {
    $.ajax({
      url: "/publish/portfolio/list",
      success: function (result) {
        var portfolios = result.portfolios
        for (var portfolio of portfolios) {
          addPortfolioItem(portfolio)
        }
        var count = Math.max(6 - portfolios.length, 0)
        for (var i = 0; i < count; i++) {
          addPortfolioItem()
        }

        $(".portfolio-gallery").sortable({
          draggable: ".portfolio-item.sortable",
          swapThreshold: 1,
          animation: 150,
          onUpdate: function (e) {
            var list = []
            $(".portfolio-item.sortable").each(function (i, elem) {
              list.push($(elem).data("id"))
            })
            $.ajax({
              url: "publish/portfolio/reorder",
              type: "POST",
              dataType: "JSON",
              data: {
                order: list,
              },
              success: function () {
                console.log("success")
              },
            })
          },
        })

        resizeProjectDomainList()
      },
    })
  }

  function initPortfolio() {
    $(".portfolio-button").click(function () {
      var domains = $(".project-slug")
      if (domains.length == 0) {
        var item = $(".portfolio-item")[0]
        if ($(item).find(".questionmark").length > 0) {
          $(item).empty()
          $(item).append(
            '<div class="warning-msg"><p>You have not published any projects yet</p><p>Published projects display here so you can share them with the world</p></div>'
          )
        } else {
          $(item).empty()
          $(item).append('<div class="questionmark"></div>')
        }
      } else {
        $(".project-slug-list").slideToggle(400, "swing")
      }
    })

    $(".project-slug").click(function () {
      var id = $(this).data("id")
      $.ajax({
        url: "/publish/portfolio/add",
        type: "POST",
        dataType: "JSON",
        data: {
          id: id,
        },
        success: function (result) {
          if (result.status == "success") {
            addPortfolioItem(result.portfolio)
            $(".project-slug-list").hide()
          } else {
            alert(result.message)
          }
        },
      })
    })

    $(".edit-portfolio").click(function () {
      $(this).hide()
      $(".portfolio-background-options").show()
    })
    $(".portfolio-background-option").click(function () {
      var type = $(this).data("type")
      if (type == "image" || type == "video" || type == "animation") {
        var fileInput = document.createElement("input")
        var filter = "image/*"
        if (type == "video") {
          filter = "video/*"
        } else if (type == "animation") {
          filter = "application/JSON"
        }
        fileInput.type = "file"
        fileInput.accept = filter
        fileInput.addEventListener("change", function () {
          var formData = new FormData()
          formData.append("thumbnail", fileInput.files[0])
          formData.append("type", type)
          $.ajax({
            url: "/account/portfolio",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (res) {
              $(".portfolio-bg").remove()
              $(".portfolio-banner").css("background", "")
              if (type == "image") {
                $(".portfolio-banner").css("background", `url(${res.url})`)
              } else if (type == "video") {
                $(".portfolio-banner").prepend(`
                  <video class="portfolio-bg" preload="auto" autoplay="true" loop="loop" muted="muted" volume="0">
                    <source src="${res.url}">
                    </source>
                  </video>
                `)
              } else if (type == "animation") {
                $(".portfolio-banner").prepend(`
                  <lottie-player class="portfolio-bg" autoplay loop src="${res.url}">
                  </lottie-player>
                `)
              }
            },
          })
        })
        fileInput.click()
      } else {
        var slug = $(this).data("slug")
        $.ajax({
          type: "POST",
          url: "/account/profile",
          dataType: "JSON",
          data: {
            "profile.portfolio.backgroundType": "app",
            "profile.portfolio.backgroundUrl": "/" + slug,
          },
          success: function (res) {
            $(".portfolio-bg").remove()
            $(".portfolio-banner").css("background", "")
            $(".portfolio-banner").prepend(`
              <iframe class="portfolio-bg" src="/${slug}">
              </iframe>
            `)
          },
        })
      }
    })

    $(document).on("click", function (e) {
      if (
        !$(e.target).closest(".edit-portfolio").length &&
        !$(e.target).closest(".portfolio-background-options").length
      ) {
        $(".portfolio-background-options").hide()
        $(".edit-portfolio").show()
      }
    })

    $(document).on("click", ".portfolio-thumbnail-button", function () {
      var item = $(this).closest(".portfolio-item")
      var slug = item.data("slug")
      var fileInput = document.createElement("input")
      fileInput.type = "file"
      fileInput.accept = "image/*"
      fileInput.addEventListener("change", function () {
        var formData = new FormData()
        formData.append("slug", slug)
        formData.append("thumbnail", fileInput.files[0])
        $.ajax({
          url: "/publish/portfolio/thumbnail",
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          success: function (res) {
            if (item.find(".questionmark").length == 0) {
              item.find(".portfolio-image").attr("src", res.url)
            } else {
              item
                .find(".questionmark")
                .replaceWith($(`<img class="portfolio-image" src="${res.url}"></img>`))
            }
          },
        })
      })
      fileInput.click()
    })

    $(document).on("click", ".portfolio-description-button", function () {
      $(this)
        .closest(".portfolio-item")
        .find(".portfolio-description")
        .css({ opacity: "1", "z-index": "1" })
    })

    $(document).on("click", ".portfolio-description-exit", function () {
      $(this)
        .closest(".portfolio-item")
        .find(".portfolio-description")
        .css({ opacity: "0", "z-index": "unset" })
    })

    $(document).on("click", ".portfolio-description-edit", function () {
      let portfolioItem = $(this).closest(".portfolio-item")
      portfolioItem.find(".portfolio-description-editing").show()
      portfolioItem.find(".portfolio-description-nonediting").hide()
      portfolioItem.find(".portfolio-description-text").removeAttr("disabled")
    })

    $(document).on("click", ".portfolio-description-undo", function () {
      let portfolioItem = $(this).closest(".portfolio-item")
      let portfolioTextarea = portfolioItem.find(".portfolio-description-text")
      let undoText = portfolioTextarea.attr("data-undo-text")
      portfolioTextarea.val(undoText)
    })

    $(document).on("click", ".portfolio-description-save", function () {
      let portfolioItem = $(this).closest(".portfolio-item")
      let id = portfolioItem.data("id")
      let portfolioTextarea = portfolioItem.find(".portfolio-description-text")
      let description = portfolioTextarea.val().trim()
      let undoText = portfolioTextarea.attr("data-undo-text").trim()

      if (description != undoText) {
        $.ajax({
          type: "POST",
          url: "/publish/portfolio/description",
          dataType: "JSON",
          data: {
            id: id,
            description: description,
          },
          success: function (response) {
            if (response.status == "success") {
              portfolioItem.find(".portfolio-description-editing").hide()
              portfolioItem.find(".portfolio-description-nonediting").show()
              portfolioItem.find(".portfolio-description-text").prop("disabled", true)
            }
            if (response.message) {
              alert(response.message)
            }
          },
        })
      }
    })

    $(document).on("click", ".portfolio-launch-button", function () {
      var portfolio = $(this).closest(".portfolio-item")
      var slug = portfolio.data("slug")
      window.open(`/${slug}`)
    })
    var pp2 = new popup(".popup2-wrapper")

    $(document).on("click", ".portfolio-share-button", function () {
      var self = $(this)

      pp2.show()
      $(".app-popup-share").fadeIn()

      //add link text
      var fullLink = "https://" + getDomain() + self.data("slug")
      $(".social-url-copy-link").text(fullLink)
      $(".social-embed-text-copy").text('<iframe src="' + fullLink + '"></iframe>')
      //CREATING GLOBAL OBJECT WITH DATA FOR SHARING
      shareData = {}
      shareData.slug = self.data("slug")
      shareData.username = self.data("username")
      shareData.title = self.data("title")
      shareData.thumbnail = self.data("thumbnail")
      shareData.details = self.data("details")
      //reset popup
      $(".app-popup-share").addClass("opened")
      //getMailTo
      var subject = "arcade.studio helped me create this! " + shareData.title
      var body = "Check it out! " + "\n" + fullLink
      var emailHref = getMailTo(subject, body)
      $(".shareViaEmail").attr("href", emailHref)
    })
    $(".social-close-btn-text").click(function (e) {
      closeShare()
    })
    function closeShare() {
      $(".app-popup-share").fadeOut(200, function () {
        pp2.hide()
      })
    }
    $(document).click(function (e) {
      if ($(e.target).hasClass("popup2-wrapper")) {
        pp2.hide()
      }
    })
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(
        function () {
          hideClose()
        },
        function (err) {
          console.error("Async: Could not copy text: ", err)
        }
      )
    }
    function returnBackClose() {
      $(".social-copied-btn-text").fadeOut()
      $(".social-close-btn-text").fadeIn()
    }
    function hideClose() {
      $(".social-copied-btn-text").fadeIn()
      $(".social-close-btn-text").fadeOut()
      window.setTimeout(returnBackClose, 1000)
    }
    $(".social-url-copy-link").click(function () {
      copyToClipboard($(".social-url-copy-link").text())
    })
    $(".social-embed-text-copy").click(function () {
      copyToClipboard($(".social-embed-text-copy").text())
    })
    $(document).on("click", ".shareOnFacebook", function () {
      shareOnFacebook(shareData.slug, shareData.thumbnail)
    })
    $(document).on("click", ".shareOnTwitter", function () {
      shareOnTwitter(shareData.slug, shareData.title, shareData.thumbnail)
    })
    $(document).on("click", ".shareOnReddit", function () {
      shareOnReddit(shareData.slug, shareData.details, shareData.thumbnail)
    })
    $(document).on("click", ".shareOnLinkedin", function () {
      shareOnLinkedin(shareData.slug, shareData.title, shareData.details, shareData.thumbnail)
    })
    $(document).on("click", ".shareOnPinterest", function () {
      shareOnPinterest(shareData.slug, shareData.details, shareData.thumbnail)
    })

    $(document).on("click", ".portfolio-delete-button", function () {
      if (confirm("Are you sure to delete this portfolio?")) {
        var portfolio = $(this).closest(".portfolio-item")
        var id = portfolio.data("id")
        $.ajax({
          url: "/publish/portfolio/delete",
          type: "POST",
          dataType: "JSON",
          data: {
            id: id,
          },
          success: function (result) {
            if (result.status == "success") {
              removePortfolioItem(portfolio)
            } else {
              alert(result.message)
            }
          },
        })
      }
    })

    $(window).resize(function () {
      resizeProjectDomainList()
    })

    loadPortfolio()
  }

  function addProjectItem(id, name) {
    var item = $(`<div class="project-item" data-project-id=${id}></div>`)
    item.append($(`<div class="project-name editable-object">${name}</div>`))
    item.append($(`<div class="project-button launch">launch</div>`))
    item.append($(`<div class="project-button duplicate">duplicate</div>`))
    item.append($('<div class="project-button delete">delete</div>'))

    $("#tab-project .project-list").prepend(item)
  }

  function createProject() {
    var name = $("input.project-name").val()

    if (!name) {
      alert("Please enter project name.")
      return
    }

    $.ajax({
      url: "/asset/project/create",
      type: "POST",
      dataType: "JSON",
      data: {
        name: name,
      },
      success: function (result) {
        $("input.project-name").val("")
        if (result.status == "success") {
          addProjectItem(result.id, name)
        } else if (result.status == "limit") {
          proPopup.show()
        }
      },
    })
  }

  function initProject() {
    $(document).on("click", ".project-button.create", function () {
      createProject()
    })

    $(document).on("keypress", "input.project-name", function (event) {
      if (event.key === "Enter") {
        createProject()
      }
    })

    $(document).on("click", ".project-button.launch", function () {
      var id = $(this).closest(".project-item").data("project-id")
      window.location.href = "/asset/projects/" + id
    })

    $(document).on("click", ".project-button.duplicate", function () {
      var item = $(this).closest(".project-item")
      var id = item.data("project-id")

      $.ajax({
        type: "POST",
        url: "/asset/project/duplicate",
        dataType: "JSON",
        data: {
          id: id,
        },
        success: function (result) {
          if (result.status == "success") {
            addProjectItem(result.id, result.name)
          } else if (result.status == "limit") {
            proPopup.show()
          }
        },
      })
    })

    $(document).on("click", ".project-button.delete", function () {
      if (confirm("Are you sure to delete this project?")) {
        var item = $(this).closest(".project-item")
        var id = item.data("project-id")

        $.ajax({
          type: "POST",
          url: "/asset/project/delete",
          dataType: "JSON",
          data: {
            id: id,
          },
          success: function () {
            item.remove()
          },
        })
      }
    })
  }

  function initAccount() {
    $(".password").click(function () {
      $(".password-div").hide()
      $(".change-password-div").show()
    })

    $(".show-pass").on("click", () => {
      let passInputType = $("#show-pass")
      let showPassText = $(".show-pass")
      let text = showPassText.text()
      if (text === "show") {
        passInputType.attr("type", "text")
        showPassText.text("hide")
      } else {
        passInputType.attr("type", "password")
        showPassText.text("show")
      }
    })

    $(".change-password-cancel-button").click(function (e) {
      e.preventDefault()
      $(".change-password-form input[name=current_password]").val("")
      $(".change-password-form input[name=password]").val("")
      $(".change-password-div").hide()
      $(".password-div").show()
    })
    $(".change-password-button").click(function (e) {
      e.preventDefault()
      var currentPassword = $(".change-password-form input[name=current_password]").val()
      var password = $(".change-password-form input[name=password]").val()
      if (currentPassword && password) {
        $.ajax({
          url: "/account/password",
          type: "post",
          data: {
            currentPassword: currentPassword,
            password: password,
          },
          success: function (res) {
            alert(res.msg)
            $(".change-password-form input[name=current_password]").val("")
            $(".change-password-form input[name=password]").val("")
            $(".change-password-div").hide()
            $(".password-div").show()
          },
        })
      } else {
        alert("password values can not be empty.")
      }
    })

    $(".delete-confirm-nevermind").click(function () {
      $(".delete-membership-popup ").hide()
    })
    $(".confirm-delete").click(function () {
      let delete_permentaly = $("input[name='delete_permentaly']").val()
      if (delete_permentaly == "Delete permanently") {
        $.ajax({
          type: "GET",
          url: "/account/deactivate",
          dataType: "JSON",
          success: function () {
            $(".delete-membership-popup ").hide()
            $("input[name='delete_permentaly']").val("")
            window.location.href = "/logout"
          },
        })
      } else {
        $("#invalidDeactivate").show()
      }
    })
    $(".delete-link").click(function () {
      $(".delete-membership-popup ").show()
      $("#invalidDeactivate").hide()
    })

    $(".upgrade-pro").click(function () {
      $(".pro-price").toggle()
      $(".payment-panel").toggle()
    })

    $("#payment-stripe").click(function () {
      var tab = $(this).closest(".payment-with-stripe").attr("data-tab")
      var billing = $(this).closest(".payment-with-stripe").attr("data-current-billing")
      $(".paypal-pay").hide()
      if (tab == "account" || billing == "paypal") {
        $(".stripe-pay").show()
      }
    })

    $("#payment-paypal").click(function () {
      $(".stripe-pay").hide()
      $(".paypal-pay").show()
    })

    $(".coupon-submit").click(function () {
      var code = $(".coupon-code").val()
      $.ajax({
        method: "POST",
        url: "/payment/coupon",
        dataType: "json",
        data: {
          code: code,
        },
        success: function (status) {
          if (status.valid) {
            $(".coupon-field").hide()
            $(".coupon-valid").show()
            $(".coupon-code").attr("placeholder", status.message)
            $(".monthly-price").text(status.price)
          } else {
            $(".coupon-valid").hide()
            // $(".monthly-price").text(29)
            $(".coupon-code").val("")
            $(".coupon-code").addClass("invalid")
            $(".coupon-code").attr("placeholder", status.message)
          }
        },
      })
    })

    $(".promo-code").click(function () {
      $(this).hide()
      $(".coupon-form").show()
    })
  }

  function initBilling() {
    $(".current-card .edit").click(function () {
      $(".stripe-pay").toggle()
    })

    $(".checkout-button.stripe-cancel").click(function () {
      $(".stripe-pay").hide()
    })

    $(".cancel-pro").click(function () {
      $(".cancel-pro-content").toggle()
    })

    $(".checkout-button.switch").click(function () {
      $.ajax({
        url: "/payment/cancel-pro-user",
        method: "POST",
        success: function () {
          window.location.href = "/create"
        },
      })
    })

    $(".checkout-button.nevermind").click(function () {
      $(".cancel-pro-content").hide()
    })
  }

  return {
    init: function () {
      initTab()
      initRenameEvent()
      initPortfolio()
      initProject()
      initAccount()
      initBilling()
    },
  }
}

$(function () {
  var instance = new create()
  instance.init()
})
