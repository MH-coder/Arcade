;(function () {
  $(function () {
    var stripe
    var csrf_token = $('meta[name="csrf-token"]').attr("content")
    var pId = ""
    // var customError = ""
    // window.customError = customError
    var stripeElements = function (publicKey, clientSecret) {
      stripe = Stripe(publicKey)
      var elements = stripe.elements({ clientSecret })

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

      window.card.on("change", function (event) {
        if (event.complete) {
          $(".div-continue-arrow").show()
        }
      })

      const el = ".payment-box-content .card-details .payment-method-buttons .save"
      $(document).on("click", el, async function (evt) {
        evt.preventDefault()
        subId = $(this).children(".subId").text()

        changeLoadingState(true)
        await confirmAndSavePaymentMethod(stripe, clientSecret, $(this), subId)
        window.card.clear()
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

    var confirmAndSavePaymentMethod = async function (stripe, clientSecret, el, subId) {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: window.card,
        },
      })
      console.log({ result })
      if (result.error) {
        changeLoadingState(false)
        showCardError(result.error)
      } else {
        fetch("/payment/stripe-save-payment-method", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethodId: result.setupIntent.payment_method,
            _csrf: csrf_token,
          }),
        }).then(async (response) => {
          $(".card-details").hide()
          $(".payment-box-text").show()
          const temp = await response.json()
          const { paymentId, paymentableId, subId, paymentMethodsLength } = temp
          if(paymentMethodsLength == 1)
            $(
              `<div class='payment-box'><div class='card-content-flagged'><div class='default-text'>Default</div><div class='payment-text'>${temp.title}</div></div></div>`
            ).insertAfter(".add-pay-box")
          else
            $(
              `<div class='payment-box'><div class='card-opt'></div><div class='card-popup'><div class="delete-payment-card" data-id=${paymentId}>Delete</div><div class="make-default-card" data-pid=${paymentId} data-id=${paymentableId}>Make Default</div><div class="subId">${!!subId ? subId : ""}</div></div><div class="card-content"><div class="payment-text">${temp.title}</div></div></div>`
            ).insertAfter(".add-pay-box")

          $(".card-opt").off("click");
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
          // window.location.reload()
          /* $.ajax({
            method: "POST",
            url: "/payment/update-subscription-payment-method",
            data: { pid: paymentId, id: paymentableId, subId },
            success: function () {
              $(
                `<div class='payment-box'><div class='card-content-flagged'><div class='default-text'>Default</div><div class='payment-text'>${temp.title}</div></div></div>`
              ).insertAfter(".add-pay-box")
              window.location.reload()
            },
            error: function (response) {
              console.log("error", response)
              window.location.reload()
            },
          }) */

          // fetch("/payment/update-subscription-payment-method", {
          //   method: "POST",
          //   body: JSON.stringify({
          //     pid: paymentId,
          //     id: paymentableId,
          //     subId,
          //   }),
          // })
          //   .then(() => {
          //     $(
          //       `<div class='payment-box'><div class='card-opt'></div><div class='card-popup'><div class='delete-payment-card' data-id=${temp.paymentId}></div></div><div class='card-content'><div class='payment-text'>${temp.title}</div></div></div>`
          //     ).insertAfter(".add-pay-box")
          //   })
          //   .catch((error) => {
          //     console.error("Error:", error)
          //   })

          // const data = await response.json();
          // orderComplete(null);
          // console.log({data});
          // let save = el;
          // save.parent().find('.cancel').trigger('click');
          // if(save.parent().parent().hasClass('card-details')) {
          //   let newBox =
          //     `<div class="each-payment" data-id="${data.paymentId}" data-type="card">
          //       <div class="added-payment-box">
          //           <span>${data.title}</span>
          //           <div class="menu">
          //               <div class="menu-items-wrap">
          //                   <div class="menu-icon">
          //                       <div></div><div></div><div></div>
          //                   </div>
          //                   <div class="clearfix"></div>
          //                   <ul class="menu-items">
          //                       <li class="arcade-open-modal edit-card" data-target="edit-stripe-card" data-title="${data.title}" data-id="${data.paymentId}">Edit</li>
          //                       <li class="arcade-open-modal delete-card" data-target="delete-stripe-card" data-title="${data.title}" data-id="${data.paymentId}">Delete</li>
          //                       <li class="view-transaction-history">View Transaction History</li>
          //                   </ul>
          //               </div>
          //           </div>
          //       </div>
          //     </div>`;
          //   save.closest('.each-payment').before(newBox);

          //   const radioButton =
          //     `<label class="arcade-radio">
          //       <span class="title">${data.title}</span>
          //       <input type="radio" name="power_up_payment_method" value="${data.paymentId}" data-type="card">
          //       <span class="checkmark"></span>
          //     </label>`;
          //   const addPaymentMethod = $('#power-up-on .body > div > .add-payment-method');
          //   addPaymentMethod.before(radioButton);

          //   const radioButton2 =
          //     `<label class="arcade-radio">
          //       <span class="title">${data.title}</span>
          //       <input class="target-current-payment-id" type="radio" name="power_up_payment_method" value="${data.paymentId}" data-type="card">
          //       <span class="checkmark"></span>
          //     </label>`;
          //   const addPaymentMethod2 = $('#power-up-update .body > div > .add-payment-method');
          //   addPaymentMethod2.before(radioButton2);

          //   const continueWithEl = save.parent().parent().parent().find('[name="continue_with"]');
          //   let continueWith = continueWithEl.val();
          //   continueWith = continueWith.split(':');
          //   if(continueWith[0] == 'power_ups') {
          //     setTimeout(function() {
          //       $('.account-submenus [data-target="power-ups"]').trigger('click');
          //       setTimeout(function() {
          //         $('.each-power-up#' + continueWith[1] + ' .arcade-switch input').trigger('click');
          //       }, 100);
          //     }, 100);

          //     continueWithEl.val('');
          //   }

          // } else {
          //   const cardBox = $('#tab-account .all-payments .each-payment[data-id="'+data.paymentId+'"][data-type="card"] .added-payment-box');
          //   cardBox.find('> span').text(data.title);
          //   const menuItems = cardBox.find('.menu .menu-items');
          //   menuItems.find('.edit-card').data({title: data.title, id: data.paymentId});
          //   menuItems.find('.delete-card').data({title: data.title, id: data.paymentId});

          //   const arcadeRadio = $('#power-up-on .body > div > .arcade-radio > [name="power_up_payment_method"][value="' + data.paymentId + '"][data-type="card"]');
          //   arcadeRadio.val(data.paymentId);
          //   arcadeRadio.parent().find('span.title').text(data.title);

          //   const arcadeRadio2 = $('#power-up-update .body > div > .arcade-radio > [name="power_up_payment_method"][value="' + data.paymentId + '"][data-type="card"]');
          //   arcadeRadio2.val(data.paymentId);
          //   arcadeRadio2.parent().find('span.title').text(data.title);
          // }
        })
      }
    }

    var updatePaymentMethodAndSubscription = function (stripe, card) {
      stripe.createPaymentMethod("card", card, {}).then(function (result) {
        if (result.error) {
          showCardError(result.error)
        } else {
          updateSubscription(result.paymentMethod.id)
        }
      })
    }

    async function updateSubscription(paymentMethod) {
      return fetch("/payment/stripe-update-subscription", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          _csrf: csrf_token,
        }),
      })
        .then((response) => {
          return response.json()
        })
        .then((subscription) => {
          handleSubscription(subscription)
        })
    }

    function handleSubscription(subscription) {
      const { latest_invoice } = subscription
      const { payment_intent } = latest_invoice

      if (payment_intent) {
        const { client_secret, status } = payment_intent

        if (status === "requires_action") {
          stripe.confirmCardPayment(client_secret).then(function (result) {
            if (result.error) {
              // Display error message in your UI.
              // The card was declined (i.e. insufficient funds, card has expired, etc)
              changeLoadingState(false)
              showCardError(result.error)
            } else {
              // Show a success message to your customer
              confirmSubscription(subscription.id)
            }
          })
        } else {
          // No additional information was needed
          // Show a success message to your customer
          orderComplete(subscription)
        }
      } else {
        orderComplete(subscription)
      }
    }

    function confirmSubscription(subscriptionId) {
      return fetch("/payment/stripe-subscription", {
        method: "post",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
          _csrf: csrf_token,
        }),
      })
        .then(function (response) {
          return response.json()
        })
        .then(function (subscription) {
          orderComplete(subscription)
        })
    }

    /* ------- Post-payment helpers ------- */

    /* Shows a success / error message when the payment is complete */
    var orderComplete = function (subscription) {
      changeLoadingState(false)
      // window.location.href = "/create";
    }

    // Show a spinner on subscription submission
    var changeLoadingState = function (isLoading) {
      if (isLoading) {
        $(".stripe-form .stripe-update").prop("disabled", true)
        $(".stripe-form .stripe-update .spinner").css("display", "flex")
        $(".stripe-form .stripe-update .button-text").hide()
      } else {
        $(".stripe-form .stripe-update").prop("disabled", false)
        $(".stripe-form .stripe-update .spinner").css("display", "none")
        $(".stripe-form .stripe-update .button-text").show()
      }
    }

    // New Membership code
    getStripePublicKey().then()
    $(document).on("click", ".div-upgrade-now-btn", function () {
      if (!$("#stripe-card").html()) {
        // $(".div-continue-arrow").hide()
        // getStripePublicKey().then()
      }
    })

    async function getStripePublicKey() {
      const response = await fetch("/payment/stripe-setup-intent-secret", {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const responseKey = await fetch("/payment/stripe-key", {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const key = await responseKey.json()
      const secret = await response.json()
      stripeMembershipElements(key.publicKey, secret.client_secret)
    }

    var stripeMembershipElements = function (publicKey, clientSecret) {
      stripe = Stripe(publicKey)
      var elements = stripe.elements({ clientSecret })

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
      window.card.mount("#stripe-card")

      // Element focus ring
      window.card.on("focus", function () {
        var el = document.getElementById("stripe-card")
        el.classList.add("focused")
      })

      window.card.on("blur", function () {
        var el = document.getElementById("stripe-card")
        el.classList.remove("focused")
      })

      const el = ".div-continue-arrow"
      $(document).on("click", el, async function (evt) {
        evt.preventDefault()
        changeLoadingState(true)
        await confirmAndSaveStripePaymentMethod(stripe, clientSecret, $(this))
        window.card.clear()
      })
    }

    var confirmAndSaveStripePaymentMethod = async function (stripe, clientSecret, el) {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: window.card,
        },
      })
      console.log({ result })
      if (result.error) {
        // window.customError = "stripeCardError"
        changeLoadingState(false)
        alert(result.error.message)
      } else {
        changeLoadingState(false)
        fetch("/payment/stripe-save-payment-method", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethodId: result.setupIntent.payment_method,
            _csrf: csrf_token,
          }),
        }).then(async (response) => {
          const data = await response.json()
          console.log("saved Payment Method", { data })
          // upgradeToProMembership(data.paymentId, data.title)
          $(".finalise-pro-purchase").show()
          $(".pro-upgrade-now-form").hide()
          // uncheck all the checkboxes
          $("input[name='saved_cards']").each(function () {
            $(this).prop("checked", false)
          })
          // insert here with checked
          $(".pro-save-cards-list").prepend(
            `<div class="card-entry"><div class="single-card-entry"><input type="radio" name="saved_cards" value="${data.paymentId}" checked><span class="single-card-text">${data.title}</span></div></div>`
          )
        })
      }
    }

    // TODO: only call when card payment btn is clicked
    async function getPublicKey() {
      const response = await fetch("/payment/stripe-setup-intent-secret", {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const responseKey = await fetch("/payment/stripe-key", {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      })
      $(".loader").hide()
      $(".card-details").show()
      const key = await responseKey.json()
      const secret = await response.json()
      stripeElements(key.publicKey, secret.client_secret)
    }

    $(document).on("click", ".payment-box-text", function () {
      // $('.card-details').show()
      $(".loader").show()
      $(".payment-box-text").hide()
      getPublicKey().then()
    })

    $(document).on(
      "click",
      ".box-content .card-details .payment-method-buttons .cancel",
      function () {
        $(".card-details").hide()
        $(".payment-box-text").show()
        $(".loader").hide()
      }
    )
  })
})()
