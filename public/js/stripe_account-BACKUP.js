(function () {
  $(function () {
    var stripe;
    var csrf_token = $('meta[name="csrf-token"]').attr("content");

    var stripeElements = function (publicKey) {
      stripe = Stripe(publicKey);
      var elements = stripe.elements();

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
      };

      var card = elements.create("card", { style: style });

      card.mount("#card-element");

      // Element focus ring
      card.on("focus", function () {
        var el = document.getElementById("card-element");
        el.classList.add("focused");
      });

      card.on("blur", function () {
        var el = document.getElementById("card-element");
        el.classList.remove("focused");
      });

      /*document
        .querySelector(".stripe-subscription-button")
        .addEventListener("click", function (evt) {
          evt.preventDefault();
          changeLoadingState(true);
          // Initiate payment
          createPaymentMethodAndCustomer(stripe, card);
        });*/
    };

    function showCardError(error) {
      changeLoadingState(false);
      // The card was declined (i.e. insufficient funds, card has expired, etc)
      var errorMsg = document.querySelector(".sr-field-error");
      errorMsg.textContent = error.message;
      setTimeout(function () {
        errorMsg.textContent = "";
      }, 8000);
    }

    var createPaymentMethodAndCustomer = function (stripe, card) {
      stripe.createPaymentMethod("card", card, {}).then(function (result) {
        if (result.error) {
          showCardError(result.error);
        } else {
          createCustomer(result.paymentMethod.id);
        }
      });
    };

    async function createCustomer(paymentMethod) {
      return fetch("/payment/stripe-create-customer", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          coupon: $(".coupon-code").val(),
          _csrf: csrf_token,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then((subscription) => {
          handleSubscription(subscription);
        });
    }

    function handleSubscription(subscription) {
      const { latest_invoice } = subscription;
      const { payment_intent } = latest_invoice;

      if (payment_intent) {
        const { client_secret, status } = payment_intent;

        if (status === "requires_action") {
          stripe.confirmCardPayment(client_secret).then(function (result) {
            if (result.error) {
              // Display error message in your UI.
              // The card was declined (i.e. insufficient funds, card has expired, etc)
              return fetch("/payment/cancel-pro-user", {
                method: "post",
              })
                .then((res) => res.json())
                .then((subscription) => {
                  changeLoadingState(false);
                  showCardError(result.error);
                });
            } else {
              // Show a success message to your customer
              confirmSubscription(subscription.id);
            }
          });
        } else {
          // No additional information was needed
          // Show a success message to your customer
          orderComplete(subscription);
        }
      } else {
        orderComplete(subscription);
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
          return response.json();
        })
        .then(function (subscription) {
          console.log(subscription);
          orderComplete(subscription);
        });
    }

    function getPublicKey() {
      return fetch("/payment/stripe-key", {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (response) {
          stripeElements(response.publicKey);
        });
    }

    getPublicKey();

    /* ------- Post-payment helpers ------- */

    /* Shows a success / error message when the payment is complete */
    var orderComplete = function (subscription) {
      changeLoadingState(false);
      window.location.href = "/create";
    };

    // Show a spinner on subscription submission
    var changeLoadingState = function (isLoading) {
      if (isLoading) {
        $(".stripe-form .checkout-button").prop("disabled", true);
        $(".stripe-form .checkout-button .spinner").css("display", "flex");
        $(".stripe-form .checkout-button .button-text").hide();
      } else {
        $(".stripe-form .checkout-button").prop("disabled", false);
        $(".stripe-form .checkout-button .spinner").css("display", "none");
        $(".stripe-form .checkout-button .button-text").show();
      }
    };
  });
})();
