jQuery(document).ready(function ($) {
  var stripe
  var csrf_token = $('meta[name="csrf-token"]').attr("content")

  function getPublicKey() {
    return fetch("/payment/stripe-key", {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        return response.json()
      })
      .then(function (response) {
        stripeElements(response.publicKey)
      })
  }

  var stripeElements = function (publicKey) {
    stripe = Stripe(publicKey)
    var elements = stripe.elements()

    // Element styles
    var style = {
      base: {
        color: "#6c8db8",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "12px",
        fontWeight: 300,
        "::placeholder": {
          color: "#6c8db8",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    }

    var card = elements.create("card", { style: style })
    window.card = card

    window.card.mount("#card-element")

    // Element focus ring
    window.card.on("focus", function () {
      var el = document.getElementById("card-element")
      el.classList.add("focused")
    })

    window.card.on("blur", function () {
      var el = document.getElementById("card-element")
      el.classList.remove("focused")
    })

    const el =
      "#tab-account .all-payments .each-payment .card-details .payment-method-buttons .save, #edit-stripe-card .foot .payment-method-buttons .save"
    $(document).on("click", el, function (evt) {
      evt.preventDefault()
      changeLoadingState(true)
      createPaymentMethod(stripe, window.card, $(this))
    })
  }

  var createPaymentMethod = function (stripe, card, el) {
    // console.log("tets----", card)

    stripe.createPaymentMethod("card", card, {}).then(function (result) {
      if (result.error) {
        showCardError(result.error)
      } else {
        createCustomer(result.paymentMethod.id, el)
      }
    })
  }

  function showCardError(error) {
    changeLoadingState(false)
    // The card was declined (i.e. insufficient funds, card has expired, etc)
    var errorMsg = document.querySelector(".sr-field-error")
    errorMsg.textContent = error.message
    setTimeout(function () {
      errorMsg.textContent = ""
    }, 8000)
  }

  async function createCustomer(paymentMethodId, el) {
    const paymentId = el.data("id")
    fetch("/payment/stripe-create-customer", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethodId: paymentMethodId,
        paymentId: paymentId,
        // coupon: $(".coupon-code").val(),
        _csrf: csrf_token,
      }),
    })
      .then(async (response) => {
        const isJson = response.headers.get("content-type")?.includes("application/json")
        const data = isJson ? await response.json() : null
        if (!response.ok) {
          const error = (data && data.message) || response.status
          return Promise.reject(error)
        }

        // console.log(JSON.stringify(data, null, 4));
        changeLoadingState(false)
        let save = el
        save.parent().find(".cancel").trigger("click")
        if (save.parent().parent().hasClass("card-details")) {
          let newBox = `<div class="each-payment" data-id="${data.paymentId}" data-type="card">
              <div class="added-payment-box">
                  <span>${data.title}</span>
                  <div class="menu">
                      <div class="menu-items-wrap">
                          <div class="menu-icon">
                              <div></div><div></div><div></div>
                          </div>
                          <div class="clearfix"></div>
                          <ul class="menu-items">
                              <li class="arcade-open-modal edit-card" data-target="edit-stripe-card" data-title="${data.title}" data-id="${data.paymentId}">Edit</li>
                              <li class="arcade-open-modal delete-card" data-target="delete-stripe-card" data-title="${data.title}" data-id="${data.paymentId}">Delete</li>
                              <li class="view-transaction-history">View Transaction History</li>
                          </ul>
                      </div>
                  </div>
              </div>
            </div>`
          save.closest(".each-payment").before(newBox)

          const radioButton = `<label class="arcade-radio">
              <span class="title">${data.title}</span>
              <input type="radio" name="power_up_payment_method" value="${data.paymentId}" data-type="card">
              <span class="checkmark"></span>
            </label>`
          const addPaymentMethod = $("#power-up-on .body > div > .add-payment-method")
          addPaymentMethod.before(radioButton)

          const radioButton2 = `<label class="arcade-radio">
              <span class="title">${data.title}</span>
              <input class="target-current-payment-id" type="radio" name="power_up_payment_method" value="${data.paymentId}" data-type="card">
              <span class="checkmark"></span>
            </label>`
          const addPaymentMethod2 = $("#power-up-update .body > div > .add-payment-method")
          addPaymentMethod2.before(radioButton2)

          const continueWithEl = save.parent().parent().parent().find('[name="continue_with"]')
          let continueWith = continueWithEl.val()
          continueWith = continueWith.split(":")
          if (continueWith[0] == "power_ups") {
            setTimeout(function () {
              $('.account-submenus [data-target="power-ups"]').trigger("click")
              setTimeout(function () {
                $(".each-power-up#" + continueWith[1] + " .arcade-switch input").trigger("click")
              }, 100)
            }, 100)

            continueWithEl.val("")
          }
        } else {
          const cardBox = $(
            '#tab-account .all-payments .each-payment[data-id="' +
              data.paymentId +
              '"][data-type="card"] .added-payment-box'
          )
          cardBox.find("> span").text(data.title)
          const menuItems = cardBox.find(".menu .menu-items")
          menuItems.find(".edit-card").data({ title: data.title, id: data.paymentId })
          menuItems.find(".delete-card").data({ title: data.title, id: data.paymentId })

          const arcadeRadio = $(
            '#power-up-on .body > div > .arcade-radio > [name="power_up_payment_method"][value="' +
              data.paymentId +
              '"][data-type="card"]'
          )
          arcadeRadio.val(data.paymentId)
          arcadeRadio.parent().find("span.title").text(data.title)

          const arcadeRadio2 = $(
            '#power-up-update .body > div > .arcade-radio > [name="power_up_payment_method"][value="' +
              data.paymentId +
              '"][data-type="card"]'
          )
          arcadeRadio2.val(data.paymentId)
          arcadeRadio2.parent().find("span.title").text(data.title)
        }
      })
      .catch((error) => {
        showCardError({ message: error })
      })
  }

  var changeLoadingState = function (isLoading) {
    let el = "#tab-account .all-payments .each-payment .card-details .payment-method-buttons .save"
    if (isLoading) {
      $(el).attr("disabled", "disabled")
      $(el).find(".text").hide()
      $(el).find(".spinner").css({ display: "inline-block", height: "14px" })

      $(".stripe-form .checkout-button").prop("disabled", true)
      $(".stripe-form .checkout-button .spinner").css("display", "flex")
      $(".stripe-form .checkout-button .button-text").hide()
    } else {
      $(el).prop("disabled", false)
      $(el).find(".text").show()
      $(el).find(".spinner").css("display", "none")

      $(".stripe-form .checkout-button").prop("disabled", false)
      $(".stripe-form .checkout-button .spinner").css("display", "none")
      $(".stripe-form .checkout-button .button-text").show()
    }
  }

  getPublicKey()
})
