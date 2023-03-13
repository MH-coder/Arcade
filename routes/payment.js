const express = require("express")
const passportConfig = require("../config/passport.js")
const paymentController = require("../controllers/payment.js")

module.exports = function (app) {
  app.use("/payment", passportConfig.isAuthenticated)
  app.get("/payment/stripe-key", paymentController.getStripeKey)
  app.post("/payment/stripe-create-customer", paymentController.postStripeCreateCustomer)
  app.get("/payment/stripe-setup-intent-secret", paymentController.getStripePaymentIntent)
  app.post("/payment/stripe-save-payment-method", paymentController.stripeSavePaymentMethod)
  app.post(
    "/payment/stripe-update-powerup-payment-method",
    paymentController.updatePowerupPaymentMethod
  )

  app.post("/payment/coupon", paymentController.checkCouponCodeOnStripe)

  app.delete("/payment/delete-payment", paymentController.deletePayment)

  app.post("/payment/powerup-by-stripe", paymentController.postPowerupByStripe)
  app.post(
    "/payment/stripe-powerup-subscription-update",
    paymentController.stripePowerupSubscriptionUpdate
  )

  app.get("/payment/view-transaction", paymentController.getViewTransaction)
  app.post("/payment/upgrade-to-pro-membership", paymentController.upgradeToProMembership)
  app.post(
    "/payment/update-subscription-payment-method",
    paymentController.updateSubscritpionPaymentMethod
  )
  app.post("/payment/get-payment-details", paymentController.getPatmentDetails)
}
